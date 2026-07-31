export type GlobalPlaceholders = Record<string, string[]>;

export type Segment =
    | { type: 'text'; raw: string }
    | { type: 'placeholder'; raw: string; key: string }
    | { type: 'expression'; raw: string };

const GLOBAL_PLACEHOLDERS_KEY = 'globalPlaceholders';
const PLACEHOLDER_REGEX = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;
// Power Automate emits dynamic content expressions in two forms depending on
// context: fully braced (@{outputs('X')}) when interpolated inside a larger
// string, or bare (@outputs('X')) when the expression is the entire field
// value. Both are matched as one clean alternative each — never a mix of one
// brace with the other — so a single missing brace doesn't silently pass as
// valid.
const EXPRESSION_REGEX = /@\{(?:outputs|triggerOutputs|parameters|variables|body|triggerBody)\([^)]*\)[^,"\s}]*\}|@(?:outputs|triggerOutputs|parameters|variables|body|triggerBody)\([^)]*\)[^,"\s]*/g;
const TOKEN_REGEX = new RegExp(`${PLACEHOLDER_REGEX.source}|${EXPRESSION_REGEX.source}`, 'g');

export interface PlaceholderOption {
    label: string;
    value: string;
    tooltip?: string;
}

// SharePoint role definition IDs are stable across tenants for the default,
// built-in permission levels — so these can be hardcoded rather than looked
// up per-site.
const KNOWN_PLACEHOLDER_OPTIONS: Record<string, PlaceholderOption[]> = {
    ROLE_DEF_ID: [
        { label: 'Read', value: '1073741826', tooltip: 'View items, pages, and documents' },
        { label: 'Contribute', value: '1073741827', tooltip: 'View, add, update, and delete items and documents' },
        { label: 'Edit', value: '1073741830', tooltip: 'Add, edit, and delete lists; view, add, update, and delete list items and documents' },
        { label: 'Full Control', value: '1073741829', tooltip: 'Has full control' },
    ],
    NAV_LOCATION: [
        { label: 'Quick Launch', value: 'quicklaunch', tooltip: 'The left-hand side navigation menu' },
        { label: 'Top Navigation Bar', value: 'topnavigationbar', tooltip: 'The horizontal menu bar at the top of the site' },
    ],
};

export interface PlaceholderBooleanInfo {
    onLabel: string;
    offLabel: string;
}

// Placeholder keys that represent a true/false REST API parameter, shown in
// the UI as a Toggle with descriptive labels for each state instead of a
// free-text field.
const KNOWN_BOOLEAN_PLACEHOLDERS: Record<string, PlaceholderBooleanInfo> = {
    COPY_ROLE_ASSIGNMENTS: {
        onLabel: 'Copy permissions from parent',
        offLabel: 'Remove all inherited permissions',
    },
    IS_EXTERNAL: {
        onLabel: 'External link (points outside this site)',
        offLabel: 'Internal link (points within this site)',
    },
};

export class PlaceholderService {
    extractPlaceholders(actionJson: string): string[] {
        const matches = new Set<string>();
        const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(actionJson)) !== null) {
            matches.add(match[1]);
        }
        return Array.from(matches);
    }

    hasPlaceholders(actionJson: string): boolean {
        return new RegExp(PLACEHOLDER_REGEX.source).test(actionJson) || this.hasExpressions(actionJson);
    }

    substitutePlaceholders(actionJson: string, values: Record<string, string>): string {
        return actionJson.replace(new RegExp(PLACEHOLDER_REGEX.source, 'g'), (_, key) => values[key] ?? `{{${key}}}`);
    }

    extractExpressions(actionJson: string): string[] {
        const matches = new Set<string>();
        const regex = new RegExp(EXPRESSION_REGEX.source, 'g');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(actionJson)) !== null) {
            matches.add(match[0]);
        }
        return Array.from(matches);
    }

    hasExpressions(actionJson: string): boolean {
        return new RegExp(EXPRESSION_REGEX.source).test(actionJson);
    }

    substituteExpressions(actionJson: string, values: Record<string, string>): string {
        let result = actionJson;
        for (const [original, replacement] of Object.entries(values)) {
            if (replacement === original) { continue; }
            result = result.split(original).join(replacement);
        }
        return result;
    }

    getFieldLocation(actionJson: string, needle: string): string | null {
        const inputs = this.tryGetOperationInputs(actionJson);
        if (!inputs) { return null; }

        const fieldLabels: Array<[string[], string]> = [
            [['parameters/uri', 'uri', 'Uri'], 'URL'],
            [['parameters/headers', 'headers', 'Headers'], 'Headers'],
            [['parameters/body', 'body', 'Body'], 'Body'],
            [['parameters/method', 'method', 'Method'], 'Method'],
            [['dataset'], 'Site Address'],
            [['table'], 'List/Library'],
        ];

        for (const [candidateKeys, label] of fieldLabels) {
            for (const candidateKey of candidateKeys) {
                const value = inputs.parameters?.[candidateKey] ?? inputs[candidateKey];
                if (value !== undefined && JSON.stringify(value).includes(needle)) {
                    return label;
                }
            }
        }
        return null;
    }

    private tryGetOperationInputs(actionJson: string): any | null {
        try {
            const parsed = JSON.parse(actionJson);
            return parsed?.operationDefinition?.inputs ?? null;
        } catch {
            return null;
        }
    }

    getExpressionDisplayInfo(expression: string): { label: string; functionName: string } {
        const match = expression.match(/(outputs|triggerOutputs|parameters|variables|body|triggerBody)\(\s*'?([^')]*)'?\s*\)/);
        const functionName = match ? match[1] : 'expression';
        const argument = match ? match[2] : '';

        const labels: Record<string, string> = {
            outputs: argument || 'Outputs',
            triggerOutputs: 'Trigger output',
            parameters: argument || 'Parameter',
            variables: argument || 'Variable',
            body: argument || 'Body',
            triggerBody: 'Trigger body',
        };

        return { label: labels[functionName] ?? expression, functionName };
    }

    async getGlobalPlaceholders(): Promise<GlobalPlaceholders> {
        return new Promise((resolve) => {
            chrome.storage.local.get(GLOBAL_PLACEHOLDERS_KEY, (result) => {
                resolve(result[GLOBAL_PLACEHOLDERS_KEY] || {});
            });
        });
    }

    async addGlobalPlaceholderValue(key: string, value: string): Promise<GlobalPlaceholders> {
        const placeholders = await this.getGlobalPlaceholders();
        const existing = placeholders[key] || [];
        if (!existing.includes(value)) {
            placeholders[key] = [...existing, value];
        }
        await chrome.storage.local.set({ [GLOBAL_PLACEHOLDERS_KEY]: placeholders });
        return placeholders;
    }

    async removeGlobalPlaceholderValue(key: string, value: string): Promise<GlobalPlaceholders> {
        const placeholders = await this.getGlobalPlaceholders();
        if (placeholders[key]) {
            placeholders[key] = placeholders[key].filter(v => v !== value);
            if (placeholders[key].length === 0) {
                delete placeholders[key];
            }
        }
        await chrome.storage.local.set({ [GLOBAL_PLACEHOLDERS_KEY]: placeholders });
        return placeholders;
    }

    async updateGlobalPlaceholderValue(key: string, oldValue: string, newValue: string): Promise<GlobalPlaceholders> {
        const placeholders = await this.getGlobalPlaceholders();
        if (placeholders[key]) {
            placeholders[key] = placeholders[key].map(v => v === oldValue ? newValue : v);
        }
        await chrome.storage.local.set({ [GLOBAL_PLACEHOLDERS_KEY]: placeholders });
        return placeholders;
    }

    async deleteGlobalPlaceholder(key: string): Promise<GlobalPlaceholders> {
        const placeholders = await this.getGlobalPlaceholders();
        delete placeholders[key];
        await chrome.storage.local.set({ [GLOBAL_PLACEHOLDERS_KEY]: placeholders });
        return placeholders;
    }

    async clearGlobalPlaceholders(): Promise<void> {
        await chrome.storage.local.set({ [GLOBAL_PLACEHOLDERS_KEY]: {} });
    }

    getPlaceholderOptions(key: string, globalPlaceholders: GlobalPlaceholders): PlaceholderOption[] {
        const builtIn = KNOWN_PLACEHOLDER_OPTIONS[key] ?? [];
        const userValues = globalPlaceholders[key] ?? [];
        const knownValues = new Set(builtIn.map(o => o.value));
        const userOnly = userValues
            .filter(v => !knownValues.has(v))
            .map(v => ({ label: v, value: v }));
        return [...builtIn, ...userOnly];
    }

    getPlaceholderOptionLabel(key: string, value: string): string | null {
        const builtIn = KNOWN_PLACEHOLDER_OPTIONS[key] ?? [];
        return builtIn.find(o => o.value === value)?.label ?? null;
    }

    getKnownPlaceholderKeys(): string[] {
        return Object.keys(KNOWN_PLACEHOLDER_OPTIONS);
    }

    hasKnownPlaceholderOptions(key: string): boolean {
        return (KNOWN_PLACEHOLDER_OPTIONS[key] ?? []).length > 0;
    }

    getBooleanPlaceholderInfo(key: string): PlaceholderBooleanInfo | null {
        return KNOWN_BOOLEAN_PLACEHOLDERS[key] ?? null;
    }

    isKnownBooleanPlaceholder(key: string): boolean {
        return key in KNOWN_BOOLEAN_PLACEHOLDERS;
    }

    getKnownBooleanPlaceholderKeys(): string[] {
        return Object.keys(KNOWN_BOOLEAN_PLACEHOLDERS);
    }

    getDefaultValues(keys: string[], globalPlaceholders: GlobalPlaceholders): Record<string, string> {
        const result: Record<string, string> = {};
        for (const key of keys) {
            result[key] = globalPlaceholders[key]?.[0] ?? '';
        }
        return result;
    }

    tokenize(text: string): Segment[] {
        const segments: Segment[] = [];
        const regex = new RegExp(TOKEN_REGEX.source, 'g');
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                segments.push({ type: 'text', raw: text.slice(lastIndex, match.index) });
            }

            const raw = match[0];
            const placeholderKey = match[1];
            if (placeholderKey) {
                segments.push({ type: 'placeholder', raw, key: placeholderKey });
            } else {
                segments.push({ type: 'expression', raw });
            }

            lastIndex = match.index + raw.length;
        }

        if (lastIndex < text.length) {
            segments.push({ type: 'text', raw: text.slice(lastIndex) });
        }

        return segments;
    }

    serialize(segments: Segment[]): string {
        return segments.map(s => s.raw).join('');
    }
}
