import { world } from "@minecraft/server";

world.afterEvents.itemUseOn.subscribe(ev => {
    const block = ev.block;
    const player = ev.source;

    if (!block || block.typeId !== "water_tycoon:worker_shop") return;

    const item = player.getComponent("inventory").container.getItem(player.selectedSlot);
    if (!item) return;

    const money = player.getDynamicProperty("money") ?? 0;

    // Покупка рабочего
    if (item.typeId === "water_tycoon:buy_worker") {
        if (money < 50) return player.sendMessage("§cНужно 50 монет!");
        player.setDynamicProperty("money", money - 50);
        block.dimension.spawnEntity("water_tycoon:worker", block.location);
        player.sendMessage("§aРабочий куплен!");
    }

    // Покупка носильщика
    if (item.typeId === "water_tycoon:buy_carrier") {
        if (money < 40) return player.sendMessage("§cНужно 40 монет!");
        player.setDynamicProperty("money", money - 40);
        block.dimension.spawnEntity("water_tycoon:carrier", block.location);
        player.sendMessage("§aНосильщик куплен!");
    }

    // Покупка фильтра
    if (item.typeId === "water_tycoon:buy_filter") {
        if (money < 60) return player.sendMessage("§cНужно 60 монет!");
        player.setDynamicProperty("money", money - 60);
        block.dimension.spawnEntity("water_tycoon:filter", block.location);
        player.sendMessage("§aФильтр куплен!");
    }
});