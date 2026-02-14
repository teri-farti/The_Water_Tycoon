import { world } from "@minecraft/server";

world.afterEvents.itemUseOn.subscribe(ev => {
    const block = ev.block;
    if (!block) return;

    if (block.typeId === "water_tycoon:filter") {
        const player = ev.source;

        // Проверяем, держит ли игрок сырую воду
        const item = player.getComponent("inventory").container.getItem(player.selectedSlot);

        if (item && item.typeId === "water_tycoon:raw_water") {
            item.amount--;
            player.getComponent("inventory").container.setItem(player.selectedSlot, item.amount > 0 ? item : undefined);

            // Выдаём чистую воду
            player.runCommand("give @s water_tycoon:clean_water");

            player.sendMessage("§bВода очищена!");
        } else {
            player.sendMessage("§cУ вас нет сырой воды!");
        }
    }
});