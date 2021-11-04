import * as Minecraft from "mojang-minecraft";

import CommandsManagementClass from "./src/CommandsManagementClass.js";
import { testCommands } from "./commands/test.js";

const commandsManagement = new CommandsManagementClass();
commandsManagement.setCommandList(testCommands);
commandsManagement.initializeCommand();
