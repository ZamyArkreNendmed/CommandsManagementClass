/**
**
** CommandsManagementClass for JavaScript GameTest by @ZamyArkreNendmed
**
** Version 0.0.2 - November 3rd 2021
**
** Created for the Minecraft GameTest feature.
**
** Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
**
*/


import { World, Commands } from "mojang-minecraft";

const CommandData = class {
  constructor(identifier, data) {
    this.identifier = identifier;
    if (typeof data === "object") {
      this.description = data.description;
      this.aliases = data.aliases;
      this.overloads = data.overloads;
    }
  }

  static getFromCommandQueryData(queryData, identifier) {
    if (typeof queryData === "object" && !Array.isArray(queryData)) {
      if (typeof queryData.commands === "object" && !Array.isArray(queryData.commands) && typeof identifier === "string") {
        const commandData = queryData.commands[identifier];
        if (typeof commandData === "object" && !Array.isArray(commandData)) {
          const instance = new this;
          instance.identifier = identifier;
          if (typeof commandData === "object") {
            instance.description = commandData.description;
            instance.aliases = commandData.aliases;
            instance.overloads = commandData.overloads;
          }
          return instance;
        }
      }
    }
  }

  setAliases(...aliases) {
    if (aliases.length) this.aliases = aliases;
  }

  setDescription(description) {
    if (typeof description === "string") this.description = description;
  }

  setOverload(overloadName, overloadData) {
    if (typeof overloadName === "string") this.overloads[overloadName] = overloadData || {};
  }

  removeOverload(overloadName) {
    delete this.overloads[overloadName];
  }

  hasOverload(overloadName) {
    return typeof this.overloads[overloadName] === "object";
  }

  getOverloadData(overloadName) {
    if (typeof overloadName === "string" && typeof this.overloads[overloadName] === "object") return this.overloads[overloadName];
  }

  getOverloads() {
    return Object.keys(this.overloads);
  }

  forEachOverload(callback) {
    if (typeof callback !== "function") return;
    for (const [key, value] of Object.entries(this.overloads)) {
      callback(key, value, this.overloads);
    }
  }

  setInputArguments(overloadName, ...inputArguments) {
    if (typeof overloadName !== "string") return;
    const overloadData = this.overloads[overloadName];
    if (typeof overloadData === "object") {
      if (typeof overloadData.input === "undefined") overloadData.input = {};
      overloadData.input.arguments = inputArguments;
    }
  }

  setOutputArguments(overloadName, ...inputArguments) {
    if (typeof overloadName !== "string") return;
    const overloadData = this.overloads[overloadName];
    if (typeof overloadData === "object") {
      if (typeof overloadData.output === "undefined") overloadData.output = {};
      overloadData.output.arguments = inputArguments;
    }
  }

  setOutputCallback(overloadName, type, callback) {
    if (typeof overloadName !== "string" && !(type === "pre" || type === "post") && callback !== "function") return;
    const overloadData = this.overloads[overloadName];
    if (typeof overloadData === "object") {
      if (typeof overloadData.output === "undefined") overloadData.output = {};
      if (typeof overloadData.output.callback === "undefined") overloadData.output.callback = {};
      overloadData.output.callback[type] = callback;
    }
  }

  setOutputFormatStrings(overloadName, formatStrings) {
    if (typeof overloadName !== "string" && !Array.isArray(formatStrings)) return;
    const overloadData = this.overloads[overloadName];
    if (typeof overloadData === "object") {
      if (typeof overloadData.output === "undefined") overloadData.output = {};
      overloadData.output.format_strings = formatStrings;
    }
  }

  toJSON() {
    const commandData = {};
    commandData[this.identifier] = {};
    if (typeof this.description === "string") commandData[this.identifier].description = this.description;
    if (Array.isArray(this.aliases) && this.aliases.length) commandData[this.identifier].aliases = this.aliases;
    if (typeof this.overloads === "object") commandData[this.identifier].overloads = this.overloads;
    return commandData;
  }
};

const CommandQuery = class {
  constructor() {
    this.#commandQueryData = {};
  }
  
  setCommandQuery(name, commandData) {
    if (typeof commandData === "object" && !Array.isArray(commandData)) {
      if (Object.keys(commandData).length > 0) {
        this.#commandQueryData[name] = {
          "commands": commandData
        };
      }
    }
  }

  assignCommandInCommandQuery(name, commandData) {
    if (typeof name === "string" && typeof this.#commandQueryData[name] !== "undefined" && typeof commandData !== "undefined") this.#commandQueryData[name].commands = Object.assign(this.#commandQueryData[name].commands, commandData);
  }

  removeCommandInCommandQuery(name, commandIdentifier) {
    if (typeof name === "string" && typeof commandIdentifier === "string") {
      if (typeof this.#commandQueryData[name] === "object" && typeof this.#commandQueryData[name].commands[commandIdentifier] === "object") delete this.#commandQueryData[name].commands[commandIdentifier];
    }
  }

  getCommandQuery(name) {
    if (typeof name === "string" && typeof this.#commandQueryData[name] !== "undefined") {
      return this.#commandQueryData[name];
    }
  }
  
  assignCommandQueries(...names) {
    const commandsObject = {
      "commands": {
      }
    };
    for (const name of names) {
      commandsObject.commands = Object.assign(commandsObject.commands, this.#commandQueryData[name].commands);
    }
    return commandsObject;
  }
  
  removeCommandQuery(name) {
    if (typeof name === "string" && typeof this.#commandQueryData[name] !== "undefined") {
      delete this.#commandQueryData[name];
    }
  }
  
  resetCommandQuery() {
    this.#commandQueryData = {};
  }
  
  #commandQueryData = {};
};

export default class CommandsManagementClass {
  constructor() {
    this.commandsData = {};
    this.eventConnections = [];
    this.options = this.#defaultOptions();
    this.defaultEventListener = "beforeChat";
    this.currentDimension = World.getDimension("overworld");
  }

  static commandData() {
    return CommandData;
  }

  static commandQuery() {
    return CommandQuery;
  }

  initializeCommand(callback) {
    const instance = this;
    const worldEvent = World.events[this.defaultEventListener].subscribe((eventData) => {
      if (eventData.message.startsWith(instance.options.prefix)) {
        instance.executeCommandAs(eventData.sender, eventData.message.replace(instance.options.prefix, ""), callback, instance.options.show_errors);
        eventData.cancel = true;
      }
    });
    this.eventConnections.push(worldEvent);
    return worldEvent;
  }
  
  shutdownCommand(worldEvent) {
    if (typeof worldEvent !== "undefined") {
      if (typeof worldEvent === "number") {
        this.eventConnections = this.eventConnections.filter((value, index) => {
          if (index !== worldEvent) return true;
          World.events[this.defaultEventListener].unsubscribe(value);
          return false;
        });
      }
      else {
        this.eventConnections = this.eventConnections.filter((value, index) => {
          if (index !== this.eventConnections.indexOf(worldEvent)) return true;
          World.events[this.defaultEventListener].unsubscribe(value);
          return false;
        });
      }
    }
    else {
      worldEvent = this.eventConnections.length - 1;
      this.eventConnections = this.eventConnections.filter((value, index) => {
        if (index !== worldEvent) return true;
        World.events[this.defaultEventListener].unsubscribe(value);
        return false;
      });
    }
  }
  
  shutdownAllCommands() {
    this.eventConnections.filter(value => {
      World.events[this.defaultEventListener].unsubscribe(value);
      return false;
    });
  }
  
  setOptions(options) {
    if (typeof options === "object") {
      this.options.prefix = options.prefix;
    }
  }
  
  setCommandList(commandListData) {
    if (typeof commandListData === "object") {
      if (typeof commandListData.commands !== "undefined") {
        this.commandsData = commandListData;
      }
    }
  }
  
  parseCommandAliases(dataObject) {
    const commandData = Object.assign({}, dataObject);
    if (typeof commandData.commands === "object" && !Array.isArray(commandData.commands)) {
      for (const [commandName, data] of Object.entries(commandData.commands)) {
        if (typeof data.aliases === "object" && Array.isArray(data.aliases)) {
          if (data.aliases.length > 0) {
            data.aliases.forEach(value => {
              commandData.commands[value] = Object.assign({}, data);
              delete commandData.commands[value].aliases;
            });
          }
        }
      }
    }
    return commandData;
  }

  executeCommandAs(entityInstance, commandValue, onCallback, showErrors) {
    const instance = this;
    const commandArguments = this.#parseCommandData(commandValue);
    const commandName = commandArguments.command_name || "";
    try {
      const commandData = this.parseCommandAliases(this.commandsData).commands[commandName];
      if (typeof this.commandsData === "undefined") throw Error("Command datas do not exist. Have you tried specifying the command data?");
      if (typeof commandData === "undefined") throw SyntaxError(`No such command '${commandName}' exists.`);
      if (typeof commandData.overloads !== "object") throw Error("Command overloads do not exist for processing values. Make sure you have already defined it.");
      if (!Array.isArray(commandData.overloads)) {
        let success = false;
        const overloadEntries = Object.entries(commandData.overloads).sort();
        const overloadValues = Object.keys(commandData.overloads).sort();
        for (const [overloadName, overloadData] of overloadEntries) {
          try {
            if (!success) {
              const commandResult = this.#resolveCommandVersioning(entityInstance, commandName, commandArguments, commandData, overloadData);
              commandResult.statusMessage = "success";
              if (typeof onCallback === "function") onCallback(commandResult);
            }
            success = true;
          }
          catch (error) {
            if (overloadValues.indexOf(overloadName) >= overloadValues.length - 1) throw error;
          }
        }
      }
    }
    catch (error) {
      const commandFailedAPI = this.#commandResultAPI();
      commandFailedAPI.identifier = commandName;
      commandFailedAPI.success = false;
      commandFailedAPI.statusMessage = `${error.toString()}`;
      commandFailedAPI.entity = entityInstance;
      if (typeof onCallback === "function") onCallback(commandFailedAPI);
      if (showErrors) {
        const rawtextJSON = { "rawtext": [ { "translate": this.options.pre_error_text + commandFailedAPI.statusMessage } ] };
        Commands.run(`tellraw ${entityInstance.name.split(" ").length > 1 ? "\"" + entityInstance.name + "\"" : entityInstance.name} ${JSON.stringify(rawtextJSON)}`, instance.currentDimension);
      }
    }
  }
  
  createCommandObjectData(commandName) {
    const commandObjectData = Object.assign({}, this.#commandObjectDataAPI());
    commandObjectData.identifier = commandName;
    return commandObjectData;
  }

  #resolveCommandVersioning(entityInstance, commandName, commandArguments, commandData, commandOverloadObject) {
    const instance = this;
    const outputArguments = [];
    const input = commandOverloadObject.input;
    const output = commandOverloadObject.output;
    const inputEventData = instance.createCommandObjectData(commandName);
    let outputEventData = Object.assign({}, inputEventData);
    const commandResult = Object.assign({}, instance.#commandResultAPI());
    commandResult.entity = entityInstance;
    commandResult.identifier = commandName;
    if (typeof input === "object") {
      if (typeof input.arguments === "object") {
        const requiredArguments = input.arguments.filter(value => {
          return !value.optional;
        });
        if (commandArguments.command_arguments.length < requiredArguments.length) throw Error(`Required arguments for the '${commandName}' command are ${requiredArguments.length}, but only ${commandArguments.command_arguments.length} present.`);
        input.arguments.forEach((value, index) => {
          if (typeof input.arguments[index] !== "undefined") {
            const matchingType = instance.#commandArguments.filter(value => value.type === input.arguments[index].type)[0];
            if (typeof matchingType === "undefined") throw Error(`Undefined argument type '${input.arguments[index].type}' at index ${index} of input arguments.`);
            const handlerData = {};
            handlerData.argumentData = input.arguments[index];
            handlerData.commandName = commandName;
            handlerData.value = commandArguments.command_arguments[index];
            const returnValue = matchingType.handler(handlerData);
            if (typeof returnValue === "undefined" && !value.optional) throw Error("Failed to parse command!");
            inputEventData.data[input.arguments[index].name] = returnValue;
          }
        });
      }
    }
    commandResult.data = Object.assign({}, inputEventData.data);
    outputEventData = Object.assign({}, inputEventData);
    if (typeof output === "object") {
      if (typeof output.callback !== "undefined") {
        if (typeof output.callback.pre === "function") {
          const outputCallback = output.callback.pre(inputEventData, instance, entityInstance);
          if (typeof outputCallback === "object") {
            if (typeof outputCallback.data !== "undefined" && typeof outputCallback.type !== "undefined") {
              outputEventData = outputCallback;
              commandResult.data = Object.assign({}, outputEventData.data);
            }
          }
        }
        if (typeof output.arguments === "object") {
          output.arguments.forEach((data, index) => {
            if (typeof data !== "undefined" && typeof outputEventData.data[data.name] !== "undefined") {
              const matchingType = instance.#commandArguments.filter(value => value.type === data.type)[0];
              if (typeof matchingType === "undefined") throw Error(`Undefined argument type '${data.type}' at index ${index} of output arguments.`);
              const handlerData = {};
              handlerData.argumentData = data;
              handlerData.commandName = commandName;
              handlerData.value = outputEventData.data[data.name];
              const returnValue = matchingType.handler(handlerData);
              if (typeof returnValue === "undefined") throw Error("Failed to parse command. Invalid output argument type!");
              outputArguments.push(returnValue);
            }
          });
        }
        if (typeof output.callback.post === "function") {
          output.callback.post(outputEventData, instance, entityInstance);
        }
        if (typeof output.format_strings === "object") {
          if (Array.isArray(output.format_strings)) {
            if (typeof entityInstance === "object" && entityInstance !== null) {
              if (typeof entityInstance.name !== "undefined") {
                output.format_strings.forEach(value => {
                  if (typeof value.format === "string") {
                    const hideFormatString = false;
                    const rawtextJSON = { "rawtext": [] };
                    const withArray = Array.from(outputArguments, value => typeof value !== "object" ? String(value) : JSON.stringify(value));
                    const translateObject = { "translate": value.format, "with": withArray };
                    rawtextJSON.rawtext.push(translateObject);
                    if (typeof value.should_show === "object" && !Array.isArray(value.should_show)) {
                      if (Object.keys(value.should_show).length > 0 && Array.isArray(value.should_show.not_empty)) {
                        for (value of value.should_show.not_empty) {
                          if (typeof outputEventData.data[value] !== "object") {
                            if (outputEventData.data[value] === "" || outputEventData.data[value] === null || isNaN(outputEventData.data[value])) {
                              hideFormatString = true;
                              break;
                            }
                          }
                          else if (typeof outputEventData.data[value] === "object") {
                            if (Array.isArray(outputEventData.data[value])) {
                              if (outputEventData.data[value].length < 1) {
                                hideFormatString = true;
                                break;
                              }
                            }
                            else {
                              if (Object.keys(outputEventData.data[value]).length < 1) {
                                hideFormatString = true;
                                break;
                              }
                            }
                          }
                          else {
                            hideFormatString = true;
                            break;
                          }
                        }
                      }
                    }
                    if (!hideFormatString) Commands.run(`tellraw ${entityInstance.name.split(" ").length > 1 ? "\"" + entityInstance.name + "\"" : entityInstance.name} ${JSON.stringify(rawtextJSON)}`, instance.currentDimension);
                  }
                });
              }
            }
          }
        }
      }
    }
    return commandResult;
  }

  #parseCommandData(commandValue) {
    const argumentToTest = /^\s*((?:(?:"(?:\\.|[^"])*")|(?:'[^']*')|\\.|\S)+)\s*(.*)$/;
    let argumentTests = ["", "", commandValue];
    const argumentList = [];
    while (argumentTests = argumentToTest.exec(argumentTests[2])) {
      let quotedArgument = argumentTests[1];
      let unquotedArgument = "";
      while (quotedArgument.length > 0) {
        if (/^"/.test(quotedArgument)) {
          const quotedSection = /^"((?:\\.|[^"])*)"(.*)$/.exec(quotedArgument);
          unquotedArgument += quotedSection[1].replace(/\\(.)/g, "$1");
          quotedArgument = quotedSection[2];
        }
        else if (/^'/.test(quotedArgument)) {
          const quotedSection = /^'([^']*)'(.*)$/.exec(quotedArgument);
          unquotedArgument += quotedSection[1];
          quotedArgument = quotedSection[2];
        }
        else if (/^\\/.test(quotedArgument)) {
          unquotedArgument += quotedArgument[1];
          quotedArgument = quotedArgument.substring(2);
        }
        else {
          unquotedArgument += quotedArgument[0];
          quotedArgument = quotedArgument.substring(1);
        }
      }
      argumentList.push(unquotedArgument);
    }
    return {
      "command_name": argumentList[0],
      "command_arguments": argumentList.filter((value, index) => index > 0)
    };
  }
  
  #commandArguments = [
    {
      "type": "stringenum",
      "handler": (value) => {
        if (typeof value.argumentData.enum_values !== "object") return;
        if (Array.isArray(value.argumentData.enum_values)) {
          if (value.value === "" || !value.value || typeof value.value === "undefined") {
            if (value.argumentData.optional && typeof value.argumentData.default !== "undefined") {
              if (value.argumentData.enum_values.includes(value.argumentData.default)) return value.argumentData.default;
            }
          }
          else if ((value.argumentData.optional && typeof value.argumentData.default !== "undefined") && value.value === "undefined") {
            if (value.argumentData.enum_values.includes(value.argumentData.default)) return value.argumentData.default;
          }
          else if (value.argumentData.enum_values.includes(value.value) && typeof value.value !== "undefined") {
            return value.value;
          }
          else {
            throw SyntaxError(`Invalid enum value '${value.value}' for the following command '${value.commandName}'.`);
          }
        }
      }
    },
    {
      "type": "string",
      "handler": (value) => {
        if (typeof value.value === "object") {
          return JSON.stringify(value.value);
        }
        else if (typeof value.value !== "undefined") {
          return String(value.value);
        }
      }
    },
    {
      "type": "json",
      "handler": (value) => {
        if (typeof value.value === "object") {
          return value.value;
        }
        else if (typeof value.value === "string") {
          return JSON.parse(value.value);
        }
      }
    },
    {
      "type": "boolean",
      "handler": (value) => {
        if (value.value === "true" || value.value === true) {
          return true;
        }
        else if (value.value === "false" || value.value === false) {
          return false;
        }
      }
    },
    {
      "type": "float",
      "handler": (value) => {
        if (!isNaN(value.value) && typeof value.value !== "undefined") return parseFloat(value.value);
      }
    },
    {
      "type": "integer",
      "handler": (value) => {
        if (!isNaN(value.value) && typeof value.value !== "undefined") return parseInt(value.value);
      }
    }
  ];
  
  #commandResultAPI() {
    return {
      "identifier": null,
      "type": "command_result",
      "success": true,
      "data": {}
    };
  }
  
  #commandObjectDataAPI() {
    return {
      "identifier": null,
      "type": "command_data",
      "statusMessage": null,
      "success": true,
      "data": {}
    };
  }

  #defaultOptions() {
    return {
      "prefix": "$",
      "pre_error_text": "\u00a7\u0063",
      "show_errors": true
    };
  }
}
