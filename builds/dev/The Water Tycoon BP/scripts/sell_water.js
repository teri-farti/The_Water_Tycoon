import { world } from "@minecraft/server";

world.afterEvents.itemUse.subscribe(ev => {
    const player = ev.source;
    const item = ev.itemStack;

    if (item.typeId === "water_tycoon:clean_water_item") {
        const money = player.getDynamicProperty("money") ?? 0;
        player.setDynamicProperty("money", money + 5);

        player.sendMessage("§aВы продали воду за 5 монет!");

        // Удаляем предмет
        item.amount = 0;
    }
});