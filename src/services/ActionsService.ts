import { Constants } from "../constants/Constants";
import { IActionModel } from "../models";
import { IActionService } from "./interfaces";

export class ActionsService implements IActionService {

  public getCorrectAction(req: chrome.webRequest.WebRequestHeadersDetails, foundAction: chrome.webRequest.WebRequestBodyDetails | undefined): IActionModel | null {
    const rawData: any = foundAction?.requestBody?.raw ? foundAction.requestBody.raw[0] : null;
    const requestBody = rawData && rawData['bytes'] ? this.tryParseJson(new TextDecoder("utf-8").decode(rawData['bytes'])) : null;

    const isSharePointRequest = req.url.indexOf('_api') > -1 || req.url.indexOf('_vti_bin') > -1;

    const isGraphRequest = req.url.indexOf(Constants.MSGraphUrl) > -1;
    const headers = req.requestHeaders ? req.requestHeaders : [];
    const title = this.getTitleFromUrl(req.url);

    if ((!isSharePointRequest && !isGraphRequest) || req.frameType === "sub_frame" || (req.type as any) != 'xmlhttprequest') { return null; }

    const headersJson: any = {};
    headers.forEach(header => { headersJson[header.name] = header.value });

    let action = this.getHttpRequestActionTemplate(req.method, req.url, headersJson, title, requestBody);

    if (isSharePointRequest) {
      action = this.getHttpSharePointActionTemplate(req.method, req.url, headersJson, title, requestBody);
    }
    else {
      action = this.getCorrectGraphActionJson(req, requestBody, headersJson, title);
    }

    return {
      icon: action.icon,
      actionJson: action.actionJson,
      id: req.requestId,
      method: req.method,
      url: req.url,
      title: title,
      body: requestBody
    }
  }

  private getCorrectGraphActionJson(req: chrome.webRequest.WebRequestHeadersDetails, requestBody: any, headersJson: any, title: string): { icon: string, actionJson: string } {
    const graph1stSegment = req.url.split('/')[4];
    const graph2ndSegment = req.url.split('/')[5];
    const segmentsCombined = `${graph1stSegment}/${graph2ndSegment}`;
    if (graph1stSegment === 'groups') {
      return this.o365GroupsGraphActionTemplate(req.method, req.url, headersJson, title, requestBody);
    }

    switch (segmentsCombined) {
      case 'me/channels':
      case 'me/chats':
      case 'me/installedApps':
      case 'me/pinnedMessages':
      case 'teams/channels':
      case 'teams/chats':
      case 'teams/messages':
      case 'teams/installedApps':
      case 'teams/pinnedMessages':
      case 'users/channels':
      case 'users/chats':
      case 'users/installedApps':
      case 'users/pinnedMessages':
        return this.teamsGraphActionTemplate(req.method, req.url, headersJson, title, requestBody);
      case 'me/events':
      case 'me/calendar':
      case 'me/calendars':
      case 'me/outlook':
      case 'me/inferenceClassification':
      case 'me/mailFolders':
      case 'me/messages':
      case 'users/events':
      case 'users/calendar':
      case 'users/calendars':
      case 'users/outlook':
      case 'users/inferenceClassification':
      case 'users/mailFolders':
      case 'users/messages':
        return this.outlookGraphActionTemplate(req.method, req.url, headersJson, title, requestBody);
    }

    return this.getHttpRequestActionTemplate(req.method, req.url, headersJson, title, requestBody);
  }

  public getHttpSharePointActionTemplate(method: string,
    requestUrl: string,
    headersJson: any,
    name: string,
    requestBody: any) {

    const bodyParameter = `,"parameters/body": ${JSON.stringify(requestBody)}`;
    const isVti = requestUrl.indexOf('_vti_bin') > -1;
    const urlSplitted = isVti ? requestUrl.split('/_vti_bin') : requestUrl.split('/_api');
    const jsonString = `{
        "id": "7a3955e0-f505-4f9f-ae7f-d805943ff04d",
        "brandColor": "#036C70",
        "connectorDisplayName": "SharePoint",
        "icon": "https://connectoricons-prod.azureedge.net/releases/v1.0.1627/1.0.1627.3238/sharepointonline/icon.png",
        "isTrigger": false,
        "operationName": "${name}",
        "operationDefinition": {
          "type": "OpenApiConnection",
          "inputs": {
            "host": {
              "connectionName": "shared_sharepointonline",
              "operationId": "HttpRequest",
              "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline"
            },
            "parameters": {
              "dataset": "${urlSplitted[0]}",
              "parameters/method": "${method}",
              "parameters/uri": "${isVti ? '_vti_bin' : '_api'}${urlSplitted[1]}",
              "parameters/headers": ${JSON.stringify(headersJson)}
              ${requestBody && bodyParameter ? bodyParameter : ''}
            },
            "authentication": "@parameters('${'$'}authentication')"
          }
        }
      }`;

    return {
      icon: "https://connectoricons-prod.azureedge.net/releases/v1.0.1627/1.0.1627.3238/sharepointonline/icon.png",
      actionJson: jsonString
    }
  }

  private o365GroupsGraphActionTemplate(method: string,
    requestUrl: string,
    headersJson: any,
    name: string,
    requestBody: any) {

    const bodyParameter = `,"Body": ${JSON.stringify(requestBody)}`;
    const jsonString = `{
      "id":"b172c361-e70a-49df-ad72-5be8c0e48a6f",
      "brandColor":"#EB3C00"
      "icon": "https://connectoricons-prod.azureedge.net/releases/v1.0.1681/1.0.1681.3663/office365groups/icon.png",
      "isTrigger": false,
      "operationName": "${name}",
      "operationDefinition": {
        "type": "OpenApiConnection", "inputs": {
          "host": {
            "connectionName": "shared_office365groups",
            "operationId": "HttpRequestV2",
            "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365groups"
          },
          "parameters": {
            "Uri": "${requestUrl}",
            "Method": "${method}",
            "ContentType": "application/json"
            ${requestBody && bodyParameter ? bodyParameter : ''}
          },
          "authentication": {
            "type": "Raw",
            "value": "@json(decodeBase64(triggerOutputs().headers['X-MS-APIM-Tokens']))['$ConnectionKey']"
          }
        }, "runAfter": {}
      }
    }`;

    return {
      icon: "https://connectoricons-prod.azureedge.net/releases/v1.0.1681/1.0.1681.3663/office365groups/icon.png",
      actionJson: jsonString
    }
  }

  private teamsGraphActionTemplate(method: string,
    requestUrl: string,
    headersJson: any,
    name: string,
    requestBody: any) {
    //CustomHeader1
    const bodyParameter = `,"Body": ${JSON.stringify(requestBody)}`;
    const jsonString = `{
      "id": "c63ac87d-3625-4926-a709-48be9789f3bc",
      "brandColor": "#4B53BC",
      "icon": "https://connectoricons-prod.azureedge.net/releases/v1.0.1719/1.0.1719.3955/teams/icon.png",
      "isTrigger": false,
      "operationName": "${name}",
      "operationDefinition": {
        "type": "OpenApiConnection",
        "inputs": {
          "host": {
            "connectionName": "shared_teams",
            "operationId": "HttpRequest",
            "apiId": "/providers/Microsoft.PowerApps/apis/shared_teams"
          },
          "parameters": {
            "Uri": "${requestUrl}",
            "Method": "${method}",
            "ContentType": "application/json"
            ${requestBody && bodyParameter ? bodyParameter : ''}
          },
          "authentication": {
            "type": "Raw",
            "value": "@json(decodeBase64(triggerOutputs().headers['X-MS-APIM-Tokens']))['$ConnectionKey']"
          }
        },
        "runAfter": {}
      }
    }`;

    return {
      icon: "https://connectoricons-prod.azureedge.net/releases/v1.0.1719/1.0.1719.3955/teams/icon.png",
      actionJson: jsonString
    }
  }

  private outlookGraphActionTemplate(method: string,
    requestUrl: string,
    headersJson: any,
    name: string,
    requestBody: any) {
    const bodyParameter = `,"Body": ${JSON.stringify(requestBody)}`;
    const jsonString = `{
      "id": "37a2e863-6b96-4a08-ae7c-1f721154ba7a",
      "brandColor": "#0078D4",
      "icon": "https://connectoricons-prod.azureedge.net/releases/v1.0.1716/1.0.1716.3922/office365/icon.png",
      "isTrigger": false,
      "operationName": "${name}",
      "operationDefinition": {
        "type": "OpenApiConnection", "inputs": {
          "host": {
            "connectionName": "shared_office365",
            "operationId": "HttpRequest",
            "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365"
          },
          "parameters": {
            "Uri": "${requestUrl}",
            "Method": "${method}",
            "ContentType": "application/json"
            ${requestBody && bodyParameter ? bodyParameter : ''}
          },
          "authentication": {
            "type": "Raw",
            "value": "@json(decodeBase64(triggerOutputs().headers['X-MS-APIM-Tokens']))['$ConnectionKey']"
          }
        }, "runAfter": {}
      }
    }`;

    return {
      icon: "https://connectoricons-prod.azureedge.net/releases/v1.0.1716/1.0.1716.3922/office365/icon.png",
      actionJson: jsonString
    }
  }

  public getHttpRequestActionTemplate(method: string,
    requestUrl: string,
    headersJson: any,
    name: string,
    requestBody: any) {

    const bodyParameter = `,"body": ${JSON.stringify(requestBody)}`;
    const jsonString = `{
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
                "headers": ${JSON.stringify(headersJson)}
                ${requestBody && bodyParameter ? bodyParameter : ''}
            },
            "runAfter": {
            }
        }
    }`;

    return {
      icon: "data:image/svg+xml;base64,PCEtLSBQbGVhc2UgbGV0IHRoZSBGbG93IHRlYW0ga25vdyBpZiB0aGlzIGNoYW5nZXMuIEl0IG5lZWRzIHRvIGFsc28gYmUgY2hhbmdlZCBpbiB0aGUgUG93ZXJBcHBzLVBvcnRhbCBmb3IgRExQIFBvbGljaWVzICgvc3JjL1BvcnRhbC9Db250ZW50L0ltYWdlcy9Db25uZWN0aW9ucy9odHRwLWNvbm5lY3Rvci1pY29uLnN2ZykgLS0+DQo8c3ZnIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogPHBhdGggZmlsbD0iIzcwOTcyNyIgZD0ibTAgMGgzMnYzMmgtMzJ6Ii8+DQogPGcgZmlsbD0iI2ZmZiI+DQogIDxwYXRoIGQ9Ik0yMS4xMjcgMTAuOTgyYy0xLjA5MS0xLjgxOC0yLjk4Mi0yLjk4Mi01LjE2NC0yLjk4MnMtNC4wNzMgMS4xNjQtNS4wOTEgMi45MDljLS41MDkuODczLS44IDEuODkxLS44IDIuOTgyIDAgMy4wNTUgMi4zMjcgNS41MjcgNS4yMzYgNS44OTF2MS4wMThoMS4zODJ2LTEuMDE4YzIuOTgyLS4zNjQgNS4yMzYtMi44MzYgNS4yMzYtNS44OTEgMC0xLjAxOC0uMjkxLTIuMDM2LS44LTIuOTA5em0tMS4wMTguNTgyYy0uNDM2LjIxOC0xLjA5MS40MzYtMS44OTEuNTgyLS4xNDUtMS4xNjQtLjQzNi0yLjEwOS0uODczLTIuNzY0IDEuMTY0LjM2NCAyLjEwOSAxLjA5MSAyLjc2NCAyLjE4MnptLTIuMjU1IDIuNGMwIC42NTUtLjA3MyAxLjIzNi0uMTQ1IDEuNzQ1LS41MDkuMDczLTEuMDkxLjA3My0xLjc0NS4wNzNzLTEuMjM2IDAtMS43NDUtLjA3M2MtLjA3My0uNTgyLS4xNDUtMS4xNjQtLjE0NS0xLjc0NSAwLS40MzYgMC0uODczLjA3My0xLjMwOS41ODIuMDczIDEuMTY0LjE0NSAxLjgxOC4xNDVzMS4yMzYtLjA3MyAxLjgxOC0uMTQ1bC4wNzMgMS4zMDl6bS0xLjg5MS00LjhjLjIxOCAwIC40MzYgMCAuNjU1LjA3My40MzYuNTA5Ljg3MyAxLjYgMS4wOTEgMi45ODItLjUwOS4wNzMtMS4wOTEuMTQ1LTEuNzQ1LjE0NXMtMS4yMzYtLjA3My0xLjc0NS0uMTQ1Yy4yMTgtMS4zODIuNTgyLTIuNDczIDEuMDkxLTIuOTgyLjIxOC0uMDczLjQzNi0uMDczLjY1NS0uMDczem0tMS4zODIuMjE4Yy0uMzY0LjY1NS0uNzI3IDEuNi0uODczIDIuNzY0LS44LS4xNDUtMS40NTUtLjM2NC0xLjg5MS0uNTgyLjY1NS0xLjA5MSAxLjYtMS44MTggMi43NjQtMi4xODJ6bS0zLjQxOCA0LjU4MmMwLS43MjcuMTQ1LTEuMzgyLjQzNi0yLjAzNi41MDkuMjkxIDEuMjM2LjUwOSAyLjEwOS42NTUtLjA3My40MzYtLjA3My44NzMtLjA3MyAxLjM4MmwuMDczIDEuNzQ1Yy0xLjE2NC0uMTQ1LTEuOTY0LS40MzYtMi40NzMtLjcyN2wtLjA3My0xLjAxOHptLjI5MSAxLjZjLjU4Mi4yOTEgMS40NTUuNDM2IDIuMzI3LjU4Mi4xNDUuOTQ1LjQzNiAxLjgxOC44IDIuNC0xLjQ1NS0uNDM2LTIuNjE4LTEuNTI3LTMuMTI3LTIuOTgyem01LjE2NCAzLjEyN2wtLjY1NS4wNzNzLS40MzYgMC0uNjU1LS4wNzNjLS40MzYtLjUwOS0uOC0xLjMwOS0uOTQ1LTIuNDczLjU4Mi4wNzMgMS4wOTEuMDczIDEuNjczLjA3M3MxLjA5MSAwIDEuNjczLS4wNzNjLS4yOTEgMS4xNjQtLjY1NSAxLjk2NC0xLjA5MSAyLjQ3M3ptLjcyNy0uMTQ1Yy4zNjQtLjU4Mi42NTUtMS40NTUuOC0yLjQuODczLS4xNDUgMS43NDUtLjI5MSAyLjMyNy0uNTgyLS41MDkgMS40NTUtMS42NzMgMi41NDUtMy4xMjcgMi45ODJ6bTMuMjczLTMuNTY0Yy0uNTA5LjI5MS0xLjMwOS41ODItMi40NzMuNzI3LjA3My0uNTA5LjA3My0xLjA5MS4wNzMtMS43NDUgMC0uNDM2IDAtLjk0NS0uMDczLTEuMzgyLjgtLjE0NSAxLjUyNy0uMzY0IDIuMTA5LS42NTUuMjkxLjU4Mi40MzYgMS4zMDkuNDM2IDIuMDM2LjA3My4zNjQgMCAuNjU1LS4wNzMgMS4wMTh6TTEzLjg1NSAyMS4xNjRoNC4yMTh2MS44OTFoLTQuMjE4ek0xOC4zNjQgMjEuNjczaDEuNTI3djEuMzgyaC0xLjUyN3pNMTEuOTY0IDIxLjY3M2gxLjUyN3YxLjM4MmgtMS41Mjd6TTE1LjIzNiAyMy40MThoMS4zODJ2LjU4MmgtMS4zODJ6Ii8+DQogPC9nPg0KPC9zdmc+DQo=",
      actionJson: jsonString
    };
  }

  public getTitleFromUrl(url: string) {
    let lastPart = url.substring(url.lastIndexOf('/') + 1, url.indexOf('?') >= 0 ? url.indexOf('?') : url.length);
    return lastPart;
  }

  private tryParseJson = (jsonString: string) => {
    try {
      var o = JSON.parse(jsonString);
      if (o && typeof o === "object") {
        return o;
      }
    }
    catch (e) { }

    return jsonString
  }
}