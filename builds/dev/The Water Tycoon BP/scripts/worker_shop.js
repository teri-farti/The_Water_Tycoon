import { world, system } from "@minecraft/server";

world.afterEvents.itemUseOn.subscribe(ev => {
    const block = ev.block;
    if (!block) return;

    if (block.typeId === "water_tycoon:worker_shop") {
        const player = ev.source;

        // Цена рабочего
        const cost = 10;

        // Проверка денег
        const money = player.getDynamicProperty("money") ?? 0;

        if (money >= cost) {
            player.setDynamicProperty("money", money - cost);

            // Спавним рабочего рядом
            block.dimension.spawnEntity("water_tycoon:worker", {
                x: block.location.x + 1,
                y: block.location.y,
                z: block.location.z
            });

            player.sendMessage("§aРабочий куплен!");
        } else {
            player.sendMessage("§cНедостаточно денег!");
        }
    }
});