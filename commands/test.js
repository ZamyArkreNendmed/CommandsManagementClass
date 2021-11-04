import { Commands } from "mojang-minecraft";

const testCommands = {
  "commands": {
    "displaynumber": {
      "description": "Displays the provided number.",
      "overloads": {
        "default": {
          "input": {
            "arguments": [
              {
                "name": "number",
                "type": "float",
                "optional": true
              }
            ]
          },
          "output": {
            "callback": {
              "pre": (eventData, objectData) => {
                const object = objectData.createCommandObjectData(eventData.identifier);
                object.data.result = eventData.data.number || 0;
                return object;
              }
            },
            "arguments": [
              {
                "name": "result",
                "type": "float"
              }
            ],
            "format_strings": [
              {
                "format": "Displayed number %%1."
              }
            ]
          }
        }
      }
    },
    "summaryofnumber": {
      "description": "Gets the summary of 'a' and 'b'.",
      "overloads": {
        "default": {
          "input": {
            "arguments": [
              {
                "name": "a",
                "type": "float",
                "optional": false
              },
              {
                "name": "b",
                "type": "float",
                "optional": false
              }
            ]
          },
          "output": {
            "callback": {
              "pre": (eventData, objectData) => {
                const object = objectData.createCommandObjectData(eventData.identifier);
                object.data.result = (eventData.data.a + eventData.data.b) || 0;
                return object;
              }
            },
            "arguments": [
              {
                "name": "result",
                "type": "float"
              }
            ],
            "format_strings": [
              {
                "format": "Result = %%1."
              }
            ]
          }
        }
      }
    }
  }
};

export { testCommands };
