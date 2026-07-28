import { PlaceholderService } from "../../services";

const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};

(global as any).chrome = mockChrome;

describe("PlaceholderService", () => {
  let placeholderService: PlaceholderService;

  beforeEach(() => {
    jest.clearAllMocks();
    placeholderService = new PlaceholderService();
  });

  describe("extractPlaceholders", () => {
    it("extracts unique {{KEY}} placeholders", () => {
      const json = '{"dataset": "{{SITE_URL}}", "table": "{{LIST_ID}}", "other": "{{SITE_URL}}"}';
      expect(placeholderService.extractPlaceholders(json)).toEqual(["SITE_URL", "LIST_ID"]);
    });

    it("returns empty array when no placeholders", () => {
      expect(placeholderService.extractPlaceholders('{"dataset": "value"}')).toEqual([]);
    });
  });

  describe("extractExpressions", () => {
    it("extracts outputs() expressions", () => {
      const json = `"inputs": "@{outputs('Get_file_properties')?['body/ID']}"`;
      expect(placeholderService.extractExpressions(json)).toEqual([
        "@{outputs('Get_file_properties')?['body/ID']}",
      ]);
    });

    it("extracts triggerOutputs() and parameters() expressions when wrapped in braces", () => {
      const json = `"value": "@{triggerOutputs()['headers']['x-ms-user-name-encoded']}", "auth": "@{parameters('$authentication')}"`;
      const result = placeholderService.extractExpressions(json);
      expect(result).toContain("@{triggerOutputs()['headers']['x-ms-user-name-encoded']}");
      expect(result).toContain("@{parameters('$authentication')}");
    });

    it("does not extract an expression missing braces, e.g. @outputs(...) without { }", () => {
      const json = `"value": "@triggerOutputs()['headers']['x-ms-user-name-encoded']"`;
      expect(placeholderService.extractExpressions(json)).toEqual([]);
    });

    it("dedupes repeated expressions", () => {
      const json = `"a": "@{outputs('Compose')}", "b": "@{outputs('Compose')}"`;
      expect(placeholderService.extractExpressions(json)).toEqual(["@{outputs('Compose')}"]);
    });

    it("returns empty array when no expressions present", () => {
      expect(placeholderService.extractExpressions('{"dataset": "{{SITE_URL}}"}')).toEqual([]);
    });
  });

  describe("hasExpressions / hasPlaceholders", () => {
    it("hasExpressions is true when an expression is present", () => {
      expect(placeholderService.hasExpressions(`"a": "@{outputs('Compose')}"`)).toBe(true);
    });

    it("hasPlaceholders is true when only an expression is present (no {{}})", () => {
      expect(placeholderService.hasPlaceholders(`"a": "@{outputs('Compose')}"`)).toBe(true);
    });

    it("hasPlaceholders is true when only a {{KEY}} placeholder is present", () => {
      expect(placeholderService.hasPlaceholders('{"dataset": "{{SITE_URL}}"}')).toBe(true);
    });

    it("hasPlaceholders is false when neither is present", () => {
      expect(placeholderService.hasPlaceholders('{"dataset": "value"}')).toBe(false);
    });
  });

  describe("substituteExpressions", () => {
    it("replaces an expression with the given replacement", () => {
      const json = `"inputs": "@{outputs('Get_file_properties')?['body/ID']}"`;
      const result = placeholderService.substituteExpressions(json, {
        "@{outputs('Get_file_properties')?['body/ID']}": "@{outputs('Get_item')?['body/ID']}",
      });
      expect(result).toBe(`"inputs": "@{outputs('Get_item')?['body/ID']}"`);
    });

    it("leaves the expression untouched when replacement equals original", () => {
      const json = `"inputs": "@{outputs('Compose')}"`;
      const result = placeholderService.substituteExpressions(json, {
        "@{outputs('Compose')}": "@{outputs('Compose')}",
      });
      expect(result).toBe(json);
    });
  });

  describe("getExpressionDisplayInfo", () => {
    it("labels an outputs() expression with the step name", () => {
      const result = placeholderService.getExpressionDisplayInfo("@{outputs('Compose')?['body/ID']}");
      expect(result).toEqual({ label: "Compose", functionName: "outputs" });
    });

    it("labels a triggerOutputs() expression", () => {
      const result = placeholderService.getExpressionDisplayInfo("@triggerOutputs()['headers']['x-ms-user-name-encoded']");
      expect(result).toEqual({ label: "Trigger output", functionName: "triggerOutputs" });
    });

    it("labels a parameters() expression with the parameter name", () => {
      const result = placeholderService.getExpressionDisplayInfo("@parameters('$authentication')");
      expect(result).toEqual({ label: "$authentication", functionName: "parameters" });
    });

    it("falls back to the raw expression for unrecognized patterns", () => {
      const result = placeholderService.getExpressionDisplayInfo("@json(decodeBase64('x'))");
      expect(result).toEqual({ label: "@json(decodeBase64('x'))", functionName: "expression" });
    });
  });

  describe("getFieldLocation", () => {
    const buildActionJson = (inputs: any) => JSON.stringify({
      operationDefinition: { type: "OpenApiConnection", inputs },
    });

    it("finds a needle inside parameters/uri and labels it URL", () => {
      const json = buildActionJson({
        parameters: { "parameters/uri": "_api/web/GetFileById('{{FILE_ID}}')" },
      });
      expect(placeholderService.getFieldLocation(json, "{{FILE_ID}}")).toBe("URL");
    });

    it("finds a needle inside parameters/headers and labels it Headers", () => {
      const json = buildActionJson({
        parameters: { "parameters/headers": { UserName: "@{triggerOutputs()['headers']['x']}" } },
      });
      expect(placeholderService.getFieldLocation(json, "@{triggerOutputs()['headers']['x']}")).toBe("Headers");
    });

    it("finds a needle inside body and labels it Body", () => {
      const json = buildActionJson({ body: { Title: "{{TITLE}}" } });
      expect(placeholderService.getFieldLocation(json, "{{TITLE}}")).toBe("Body");
    });

    it("finds a needle inside dataset and labels it Site Address", () => {
      const json = buildActionJson({ parameters: { dataset: "https://contoso.sharepoint.com/sites/{{SITE_NAME}}" } });
      expect(placeholderService.getFieldLocation(json, "{{SITE_NAME}}")).toBe("Site Address");
    });

    it("returns null when the needle is not found in any known field", () => {
      const json = buildActionJson({ parameters: { "parameters/uri": "_api/web" } });
      expect(placeholderService.getFieldLocation(json, "{{MISSING}}")).toBeNull();
    });

    it("returns null when actionJson is not valid JSON", () => {
      expect(placeholderService.getFieldLocation("not json", "{{X}}")).toBeNull();
    });
  });

  describe("tokenize / serialize", () => {
    it("splits plain text with a single placeholder into text/placeholder/text segments", () => {
      const segments = placeholderService.tokenize("hello {{SITE_NAME}} world");
      expect(segments).toEqual([
        { type: "text", raw: "hello " },
        { type: "placeholder", raw: "{{SITE_NAME}}", key: "SITE_NAME" },
        { type: "text", raw: " world" },
      ]);
    });

    it("splits text with a single expression into text/expression/text segments", () => {
      const segments = placeholderService.tokenize("a @{outputs('Compose')} b");
      expect(segments).toEqual([
        { type: "text", raw: "a " },
        { type: "expression", raw: "@{outputs('Compose')}" },
        { type: "text", raw: " b" },
      ]);
    });

    it("handles zero-gap adjacent tokens without overlap (placeholder then expression)", () => {
      const segments = placeholderService.tokenize("{{SITE_NAME}}@{outputs('Compose')}");
      expect(segments).toEqual([
        { type: "placeholder", raw: "{{SITE_NAME}}", key: "SITE_NAME" },
        { type: "expression", raw: "@{outputs('Compose')}" },
      ]);
    });

    it("handles zero-gap adjacent placeholders", () => {
      const segments = placeholderService.tokenize("{{X}}{{Y}}");
      expect(segments).toEqual([
        { type: "placeholder", raw: "{{X}}", key: "X" },
        { type: "placeholder", raw: "{{Y}}", key: "Y" },
      ]);
    });

    it("returns a single text segment when there are no tokens", () => {
      const segments = placeholderService.tokenize("plain text, no tokens here");
      expect(segments).toEqual([{ type: "text", raw: "plain text, no tokens here" }]);
    });

    it("returns an empty array for an empty string", () => {
      expect(placeholderService.tokenize("")).toEqual([]);
    });

    it("preserves whitespace and newlines in multiline JSON text", () => {
      const text = '{\n  "dataset": "{{SITE_NAME}}",\n  "id": "@{outputs(\'Compose\')}"\n}';
      const segments = placeholderService.tokenize(text);
      expect(placeholderService.serialize(segments)).toBe(text);
    });

    it("round-trips serialize(tokenize(x)) === x for a variety of inputs", () => {
      const samples = [
        "no tokens",
        "{{ONLY_ONE}}",
        "prefix {{A}} middle @{outputs('B')} suffix",
        "{{A}}{{B}}@{outputs('C')}{{D}}",
        "",
        '{\n  "a": "{{SITE_NAME}}",\n  "b": "@{triggerOutputs()[\'headers\']}"\n}',
      ];
      for (const sample of samples) {
        const segments = placeholderService.tokenize(sample);
        expect(placeholderService.serialize(segments)).toBe(sample);
      }
    });
  });

  describe("global placeholders", () => {
    it("getGlobalPlaceholders returns empty object when nothing stored", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) => callback({}));
      const result = await placeholderService.getGlobalPlaceholders();
      expect(result).toEqual({});
    });

    it("getGlobalPlaceholders returns stored values", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) =>
        callback({ globalPlaceholders: { LIST_ID: ["abc"] } })
      );
      const result = await placeholderService.getGlobalPlaceholders();
      expect(result).toEqual({ LIST_ID: ["abc"] });
    });

    it("addGlobalPlaceholderValue adds a new key with its first value", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) => callback({}));
      mockChrome.storage.local.set.mockImplementation((_value, callback) => callback && callback());

      const result = await placeholderService.addGlobalPlaceholderValue("TEAM_NAME", "AcceleratorComm");

      expect(result).toEqual({ TEAM_NAME: ["AcceleratorComm"] });
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { globalPlaceholders: { TEAM_NAME: ["AcceleratorComm"] } }
      );
    });

    it("addGlobalPlaceholderValue appends an additional variant to an existing key", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) =>
        callback({ globalPlaceholders: { TEAM_NAME: ["AcceleratorComm"] } })
      );

      const result = await placeholderService.addGlobalPlaceholderValue("TEAM_NAME", "Dev");

      expect(result).toEqual({ TEAM_NAME: ["AcceleratorComm", "Dev"] });
    });

    it("addGlobalPlaceholderValue does not add a duplicate variant", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) =>
        callback({ globalPlaceholders: { TEAM_NAME: ["AcceleratorComm"] } })
      );

      const result = await placeholderService.addGlobalPlaceholderValue("TEAM_NAME", "AcceleratorComm");

      expect(result).toEqual({ TEAM_NAME: ["AcceleratorComm"] });
    });

    it("removeGlobalPlaceholderValue removes a single variant, keeping the rest", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) =>
        callback({ globalPlaceholders: { TEAM_NAME: ["AcceleratorComm", "Dev"] } })
      );

      const result = await placeholderService.removeGlobalPlaceholderValue("TEAM_NAME", "Dev");

      expect(result).toEqual({ TEAM_NAME: ["AcceleratorComm"] });
    });

    it("removeGlobalPlaceholderValue removes the key entirely once its last variant is removed", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) =>
        callback({ globalPlaceholders: { TEAM_NAME: ["AcceleratorComm"] } })
      );

      const result = await placeholderService.removeGlobalPlaceholderValue("TEAM_NAME", "AcceleratorComm");

      expect(result).toEqual({});
    });

    it("updateGlobalPlaceholderValue renames a variant in place, preserving order", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) =>
        callback({ globalPlaceholders: { TEAM_NAME: ["AcceleratorComm", "Dev"] } })
      );

      const result = await placeholderService.updateGlobalPlaceholderValue("TEAM_NAME", "AcceleratorComm", "Prod");

      expect(result).toEqual({ TEAM_NAME: ["Prod", "Dev"] });
    });

    it("deleteGlobalPlaceholder removes the key", async () => {
      mockChrome.storage.local.get.mockImplementation((_key, callback) =>
        callback({ globalPlaceholders: { TEAM_NAME: ["AcceleratorComm"], LIST_ID: ["abc"] } })
      );

      const result = await placeholderService.deleteGlobalPlaceholder("TEAM_NAME");

      expect(result).toEqual({ LIST_ID: ["abc"] });
    });

    it("clearGlobalPlaceholders resets to an empty object", async () => {
      await placeholderService.clearGlobalPlaceholders();
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ globalPlaceholders: {} });
    });
  });

  describe("getDefaultValues", () => {
    it("returns the first variant of global placeholder values for known keys", () => {
      const result = placeholderService.getDefaultValues(["TEAM_NAME", "LIST_ID"], { TEAM_NAME: ["AcceleratorComm", "Dev"] });
      expect(result).toEqual({ TEAM_NAME: "AcceleratorComm", LIST_ID: "" });
    });
  });

  describe("getPlaceholderOptions", () => {
    it("returns the built-in role definition options for ROLE_DEF_ID", () => {
      const options = placeholderService.getPlaceholderOptions("ROLE_DEF_ID", {});
      expect(options.map(o => o.label)).toEqual(["Read", "Contribute", "Edit", "Full Control"]);
      expect(options.find(o => o.label === "Read")?.value).toBe("1073741826");
      expect(options.find(o => o.label === "Full Control")?.value).toBe("1073741829");
    });

    it("includes a tooltip on each built-in option", () => {
      const options = placeholderService.getPlaceholderOptions("ROLE_DEF_ID", {});
      expect(options.every(o => !!o.tooltip)).toBe(true);
    });

    it("returns an empty array for a key with no known options and no global values", () => {
      expect(placeholderService.getPlaceholderOptions("SITE_NAME", {})).toEqual([]);
    });

    it("appends user-added global values that aren't already a built-in option", () => {
      const options = placeholderService.getPlaceholderOptions("ROLE_DEF_ID", { ROLE_DEF_ID: ["1073741826", "1073741999"] });
      expect(options.map(o => o.value)).toEqual(["1073741826", "1073741827", "1073741830", "1073741829", "1073741999"]);
    });

    it("does not duplicate a user-added value that matches a built-in option", () => {
      const options = placeholderService.getPlaceholderOptions("ROLE_DEF_ID", { ROLE_DEF_ID: ["1073741826"] });
      expect(options.filter(o => o.value === "1073741826")).toHaveLength(1);
    });

    it("uses the raw value as the label for user-added, non-built-in options", () => {
      const options = placeholderService.getPlaceholderOptions("ROLE_DEF_ID", { ROLE_DEF_ID: ["1073741999"] });
      const custom = options.find(o => o.value === "1073741999");
      expect(custom).toEqual({ label: "1073741999", value: "1073741999" });
    });
  });
});
