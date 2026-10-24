import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const defaultConfig = {
    dialogue: "Welcome! Choose an action below.",
    command: "say Hello Traveler!",
    mode: 0
};

function readConfig(entity) {
    try {
        const saved = entity.getDynamicProperty("custom:npc_config");
        return saved ? { ...defaultConfig, ...JSON.parse(saved) } : { ...defaultConfig };
    } catch {
        return { ...defaultConfig };
    }
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
    const npc = event.sourceEntity;
    const player = event.sourceEntity;
    if (!npc || !["custom:npc_gui", "custom:admin_gui"].includes(event.id)) return;

    const isAdminNpc = event.id === "custom:admin_gui";
    const config = readConfig(npc);
    const form = new ActionFormData()
        .title("NPC")
        .body(config.dialogue)
        .button("Interact")
        .button("View Info");

    if (isAdminNpc) form.button("Admin Settings");

    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === 0) {
            if (config.mode === 1) {
                player.sendMessage(config.command);
            } else {
                const command = config.command.replace(/^\//, "");
                player.runCommand(command).catch(() => player.sendMessage("§cNPC command failed."));
            }
        } else if (response.selection === 1) {
            player.sendMessage("§bCustom NPC");
        } else if (isAdminNpc && response.selection === 2 && player.isOp?.()) {
            openAdminConfig(player, npc, config);
        }
    }).catch(() => {});
});

function openAdminConfig(player, npc, config) {
    const form = new ModalFormData()
        .title("Admin NPC Settings")
        .textField("NPC dialogue", "Enter dialogue", config.dialogue)
        .textField("Command or chat message", "say Hello", config.command)
        .dropdown("On interaction", ["Run command", "Send chat message"], config.mode);

    form.show(player).then((response) => {
        if (response.canceled || !response.formValues) return;
        const [dialogue, command, mode] = response.formValues;
        if (typeof dialogue !== "string" || typeof command !== "string") return;
        try {
            npc.setDynamicProperty("custom:npc_config", JSON.stringify({ dialogue, command, mode }));
            player.sendMessage("§aNPC settings saved.");
        } catch {
            player.sendMessage("§cCould not save NPC settings.");
        }
    }).catch(() => {});
}
