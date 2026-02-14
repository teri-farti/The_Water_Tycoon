import { world } from "@minecraft/server";

const UPGRADE = {
    worker: level => 30 * level,
    carrier: level => 20 * level,
    filter: level => 40 * level
};

world.afterEvents.itemUseOn.subscribe(ev => {
    const block = ev.block;
    const player = ev.source;

    if (!block || block.typeId !== "water_tycoon:worker_shop") return;

    const item = player.getComponent("inventory").container.getItem(player.selectedSlot);
    if (!item) return;

    const type = item.typeId.replace("water_tycoon:upgrade_", "");

    const target = block.dimension.getEntities({
        type: `water_tycoon:${type}`,
        maxDistance: 10,
        location: block.location
    })[0];

    if (!target) {
        player.sendMessage("§cНет объекта рядом!");
        return;
    }

    let level = target.getDynamicProperty("level") ?? 1;

    if (level >= 10) {
        player.sendMessage("§eМаксимальный уровень!");
        return;
    }

    const cost = UPGRADE[type](level);
    let money = player.getDynamicProperty("money") ?? 0;

    if (money < cost) {
        player.sendMessage("§cНедостаточно денег!");
        return;
    }

    money -= cost;
    player.setDynamicProperty("money", money);

    level++;
    target.setDynamicProperty("level", level);

    player.sendMessage(`§a${type} улучшен до уровня §e${level}`);
});