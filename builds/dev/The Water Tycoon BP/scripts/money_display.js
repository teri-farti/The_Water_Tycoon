import { world } from "@minecraft/server";

world.afterEvents.tick.subscribe(() => {
    for (const player of world.getPlayers()) {
        const money = player.getDynamicProperty("money") ?? 0;
        player.onScreenDisplay.setActionBar(`§eМонеты: §6${money}`);
    }
});