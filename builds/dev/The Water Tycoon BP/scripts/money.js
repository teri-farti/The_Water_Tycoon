import { world } from "@minecraft/server";

world.afterEvents.playerSpawn.subscribe(ev => {
    const player = ev.player;

    if (player.getDynamicProperty("money") === undefined) {
        player.setDynamicProperty("money", 0);
    }
});

// Показываем деньги каждые 10 тиков
world.afterEvents.tick.subscribe(ev => {
    for (const player of world.getPlayers()) {
        const money = player.getDynamicProperty("money") ?? 0;
        player.onScreenDisplay.setActionBar(`§eМонеты: §6${money}`);
    }
});