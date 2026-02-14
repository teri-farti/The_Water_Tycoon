import { world } from "@minecraft/server";

world.afterEvents.itemUse.subscribe(ev => {
    const player = ev.source;
    const item = ev.itemStack;

    if (item.typeId === "water_tycoon:clean_water_item") {
        const money = world.getDynamicProperty("money") ?? 0;
        world.setDynamicProperty("money", money + 5);

        world.sendMessage("§aВы продали воду за 5 монет!");

        // Удаляем предмет
        item.amount = 0;
    }
});