import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

function openShop(player) {
    const form = new ActionFormData()
        .title("🏪 Магазин")
        .body("Выберите действие")
        .button("👷 Купить рабочего\n§e50 монет")
        .button("📦 Купить носильщика\n§e40 монет")
        .button("⚙️ Купить фильтр\n§e60 монет")
        .button("⬆️ Улучшить рабочего")
        .button("⬆️ Улучшить носильщика")
        .button("⬆️ Улучшить фильтр");

    form.show(player).then(response => {
        if (response.canceled) return;

        const money = player.getDynamicProperty("money") ?? 0;

        switch (response.selection) {

            // Купить рабочего
            case 0:
                if (money < 50) return player.sendMessage("§cНужно 50 монет!");
                player.setDynamicProperty("money", money - 50);
                player.dimension.spawnEntity("water_tycoon:worker", player.location);
                player.sendMessage("§aРабочий куплен!");
                break;

            // Купить носильщика
            case 1:
                if (money < 40) return player.sendMessage("§cНужно 40 монет!");
                player.setDynamicProperty("money", money - 40);
                player.dimension.spawnEntity("water_tycoon:carrier", player.location);
                player.sendMessage("§aНосильщик куплен!");
                break;

            // Купить фильтр
            case 2:
                if (money < 60) return player.sendMessage("§cНужно 60 монет!");
                player.setDynamicProperty("money", money - 60);
                player.dimension.spawnEntity("water_tycoon:filter", player.location);
                player.sendMessage("§aФильтр куплен!");
                break;

            // Улучшить рабочего
            case 3:
                upgradeNearest(player, "worker");
                break;

            // Улучшить носильщика
            case 4:
                upgradeNearest(player, "carrier");
                break;

            // Улучшить фильтр
            case 5:
                upgradeNearest(player, "filter");
                break;
        }
    });
}

function upgradeNearest(player, type) {
    const target = player.dimension.getEntities({
        type: `water_tycoon:${type}`,
        maxDistance: 10,
        location: player.location
    })[0];

    if (!target) return player.sendMessage("§cНет объекта рядом!");

    let level = target.getDynamicProperty("level") ?? 1;
    if (level >= 10) return player.sendMessage("§eМаксимальный уровень!");

    const cost = 20 * level;
    let money = player.getDynamicProperty("money") ?? 0;

    if (money < cost) return player.sendMessage("§cНужно " + cost + " монет!");

    money -= cost;
    player.setDynamicProperty("money", money);

    level++;
    target.setDynamicProperty("level", level);

    player.sendMessage(`§a${type} улучшен до уровня §e${level}`);
}

world.afterEvents.itemUseOn.subscribe(ev => {
    const block = ev.block;
    if (!block) return;

    if (block.typeId === "water_tycoon:worker_shop") {
        openShop(ev.source);
    }
});