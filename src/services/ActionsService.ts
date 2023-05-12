export class ActionsService {

  public getHttpSharePointActionTemplate(method: string,
    requestUrl: string,
    headers: chrome.webRequest.HttpHeader[],
    name: string,
    requestBody: any) {

    const headersJson: any = {};
    headers.forEach(header => { headersJson[header.name] = header.value });
    const bodyParameter = `,"parameters/body": ${JSON.stringify(requestBody)}`;
    const urlSplitted = requestUrl.split('/_api');
    const request = `{
      "id": "7a3955e0-f505-4f9f-ae7f-d805943ff04d", 
      "brandColor": "#036C70",
      "connectorDisplayName": "SharePoint", "icon": "https://connectoricons-prod.azureedge.net/releases/v1.0.1627/1.0.1627.3238/sharepointonline/icon.png",
      "isTrigger": false, "operationName": "${name}", "operationDefinition": {
        "type": "OpenApiConnection", "inputs":
        {
          "host": {
            "connectionName": "shared_sharepointonline", "operationId": "HttpRequest", "apiId":
              "/providers/Microsoft.PowerApps/apis/shared_sharepointonline"
          }, "parameters": {
            "dataset": "${urlSplitted[0]}",
            "parameters/method": "${method}", 
            "parameters/uri": "_api${urlSplitted[1]}",
            "parameters/headers": ${JSON.stringify(headersJson)}
            ${requestBody && bodyParameter ? bodyParameter : ''}

          }, "authentication": "@parameters('${'$'}authentication')"
        }
      }
      }`;


    return request;
  }

  public getHttpRequestActionTemplate(method: string,
    requestUrl: string,
    headers: chrome.webRequest.HttpHeader[],
    name: string,
    requestBody: any) {
    const headersJson: any = {};
    headers.forEach(header => { headersJson[header.name] = header.value });
    return `{
      "id": "faf87a3f-9c4d-4ae2-97c8-7f916bc6fa62",
      "brandColor": "#709727",
      "connectorDisplayName": "HTTP",
      "icon": "data:image/svg+xml;base64,PCEtLSBQbGVhc2UgbGV0IHRoZSBGbG93IHRlYW0ga25vdyBpZiB0aGlzIGNoYW5nZXMuIEl0IG5lZWRzIHRvIGFsc28gYmUgY2hhbmdlZCBpbiB0aGUgUG93ZXJBcHBzLVBvcnRhbCBmb3IgRExQIFBvbGljaWVzICgvc3JjL1BvcnRhbC9Db250ZW50L0ltYWdlcy9Db25uZWN0aW9ucy9odHRwLWNvbm5lY3Rvci1pY29uLnN2ZykgLS0+DQo8c3ZnIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogPHBhdGggZmlsbD0iIzcwOTcyNyIgZD0ibTAgMGgzMnYzMmgtMzJ6Ii8+DQogPGcgZmlsbD0iI2ZmZiI+DQogIDxwYXRoIGQ9Ik0yMS4xMjcgMTAuOTgyYy0xLjA5MS0xLjgxOC0yLjk4Mi0yLjk4Mi01LjE2NC0yLjk4MnMtNC4wNzMgMS4xNjQtNS4wOTEgMi45MDljLS41MDkuODczLS44IDEuODkxLS44IDIuOTgyIDAgMy4wNTUgMi4zMjcgNS41MjcgNS4yMzYgNS44OTF2MS4wMThoMS4zODJ2LTEuMDE4YzIuOTgyLS4zNjQgNS4yMzYtMi44MzYgNS4yMzYtNS44OTEgMC0xLjAxOC0uMjkxLTIuMDM2LS44LTIuOTA5em0tMS4wMTguNTgyYy0uNDM2LjIxOC0xLjA5MS40MzYtMS44OTEuNTgyLS4xNDUtMS4xNjQtLjQzNi0yLjEwOS0uODczLTIuNzY0IDEuMTY0LjM2NCAyLjEwOSAxLjA5MSAyLjc2NCAyLjE4MnptLTIuMjU1IDIuNGMwIC42NTUtLjA3MyAxLjIzNi0uMTQ1IDEuNzQ1LS41MDkuMDczLTEuMDkxLjA3My0xLjc0NS4wNzNzLTEuMjM2IDAtMS43NDUtLjA3M2MtLjA3My0uNTgyLS4xNDUtMS4xNjQtLjE0NS0xLjc0NSAwLS40MzYgMC0uODczLjA3My0xLjMwOS41ODIuMDczIDEuMTY0LjE0NSAxLjgxOC4xNDVzMS4yMzYtLjA3MyAxLjgxOC0uMTQ1bC4wNzMgMS4zMDl6bS0xLjg5MS00LjhjLjIxOCAwIC40MzYgMCAuNjU1LjA3My40MzYuNTA5Ljg3MyAxLjYgMS4wOTEgMi45ODItLjUwOS4wNzMtMS4wOTEuMTQ1LTEuNzQ1LjE0NXMtMS4yMzYtLjA3My0xLjc0NS0uMTQ1Yy4yMTgtMS4zODIuNTgyLTIuNDczIDEuMDkxLTIuOTgyLjIxOC0uMDczLjQzNi0uMDczLjY1NS0uMDczem0tMS4zODIuMjE4Yy0uMzY0LjY1NS0uNzI3IDEuNi0uODczIDIuNzY0LS44LS4xNDUtMS40NTUtLjM2NC0xLjg5MS0uNTgyLjY1NS0xLjA5MSAxLjYtMS44MTggMi43NjQtMi4xODJ6bS0zLjQxOCA0LjU4MmMwLS43MjcuMTQ1LTEuMzgyLjQzNi0yLjAzNi41MDkuMjkxIDEuMjM2LjUwOSAyLjEwOS42NTUtLjA3My40MzYtLjA3My44NzMtLjA3MyAxLjM4MmwuMDczIDEuNzQ1Yy0xLjE2NC0uMTQ1LTEuOTY0LS40MzYtMi40NzMtLjcyN2wtLjA3My0xLjAxOHptLjI5MSAxLjZjLjU4Mi4yOTEgMS40NTUuNDM2IDIuMzI3LjU4Mi4xNDUuOTQ1LjQzNiAxLjgxOC44IDIuNC0xLjQ1NS0uNDM2LTIuNjE4LTEuNTI3LTMuMTI3LTIuOTgyem01LjE2NCAzLjEyN2wtLjY1NS4wNzNzLS40MzYgMC0uNjU1LS4wNzNjLS40MzYtLjUwOS0uOC0xLjMwOS0uOTQ1LTIuNDczLjU4Mi4wNzMgMS4wOTEuMDczIDEuNjczLjA3M3MxLjA5MSAwIDEuNjczLS4wNzNjLS4yOTEgMS4xNjQtLjY1NSAxLjk2NC0xLjA5MSAyLjQ3M3ptLjcyNy0uMTQ1Yy4zNjQtLjU4Mi42NTUtMS40NTUuOC0yLjQuODczLS4xNDUgMS43NDUtLjI5MSAyLjMyNy0uNTgyLS41MDkgMS40NTUtMS42NzMgMi41NDUtMy4xMjcgMi45ODJ6bTMuMjczLTMuNTY0Yy0uNTA5LjI5MS0xLjMwOS41ODItMi40NzMuNzI3LjA3My0uNTA5LjA3My0xLjA5MS4wNzMtMS43NDUgMC0uNDM2IDAtLjk0NS0uMDczLTEuMzgyLjgtLjE0NSAxLjUyNy0uMzY0IDIuMTA5LS42NTUuMjkxLjU4Mi40MzYgMS4zMDkuNDM2IDIuMDM2LjA3My4zNjQgMCAuNjU1LS4wNzMgMS4wMTh6TTEzLjg1NSAyMS4xNjRoNC4yMTh2MS44OTFoLTQuMjE4ek0xOC4zNjQgMjEuNjczaDEuNTI3djEuMzgyaC0xLjUyN3pNMTEuOTY0IDIxLjY3M2gxLjUyN3YxLjM4MmgtMS41Mjd6TTE1LjIzNiAyMy40MThoMS4zODJ2LjU4MmgtMS4zODJ6Ii8+DQogPC9nPg0KPC9zdmc+DQo=",
      "isTrigger": false,
      "operationName": "${name}",
      "operationDefinition": {
          "type": "Http",
          "inputs": {
              "method": "${method}",
              "uri": "${requestUrl}",
              "headers": ${JSON.stringify(headersJson)},
              "body": ${JSON.stringify(requestBody)}
          },
          "runAfter": {
          }
      }
  }`
  }

  public getTitleFromUrl(url: string) {
    let lastPart = url.substring(url.lastIndexOf('/') + 1, url.indexOf('?') >= 0 ? url.indexOf('?') : url.length);
    return lastPart;
  }
}