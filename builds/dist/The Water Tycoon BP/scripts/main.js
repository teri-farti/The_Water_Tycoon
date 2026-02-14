import "./carrier.js";
import "./filter.js";
import "./money.js";
import "./sell_water.js";
import "./ui_shop.js";
import "./worker.js";
import { system, world } from "@minecraft/server";

world.afterEvents.playerSpawn.subscribe(ev => {
    ev.player.runCommandAsync("gamemode adventure @s");
});
world.afterEvents.entityHitEntity.subscribe(ev => {
    const target = ev.target;
    // Сначала проверяем, существует ли цель вообще
    if (target && target.typeId && target.typeId.includes("water_tycoon:")) {
        target.clearVelocity();
    }
});



system.afterEvents.scriptEventReceive.subscribe(ev => {
    if (ev.id === "water_tycoon:reset") {
        for (const player of world.getAllPlayers()) {
            player.setDynamicProperty("money", 100);
            player.sendMessage("§e[Система] Ваш баланс успешно сброшен и исправлен!");
        }
    }
});
world.afterEvents.entitySpawn.subscribe(ev => {
    const entity = ev.entity;
    const shopId = entity.getDynamicProperty("linked_shop_id");
    if (!shopId) return;

    // Сохраняем позицию конкретного юнита (w1_pos, w2_pos, f1_pos и т.д.)
    const loc = entity.location;
    const posStr = `${Math.floor(loc.x)} ${Math.floor(loc.y)} ${Math.floor(loc.z)}`;
    world.setDynamicProperty(`${shopId}_pos`, posStr);
});

const SHOP_POSITIONS = [
    { id: "w1", loc: { x: -25, y: -58, z: 2 }, type: "worker", label: "Рабочий #1", cost: 0, upgradeBase: 100 },
    { id: "w2", loc: { x: -20, y: -56, z: 20 }, type: "worker", label: "Рабочий #2", cost: 500, upgradeBase: 300 },
    { id: "w3", loc: { x: -2, y: -56, z: -1 }, type: "worker", label: "Рабочий #3", cost: 1500, upgradeBase: 800 },
    { id: "c1", loc: { x: -8, y: -57, z: 15 }, type: "carrier", label: "Курьер #1", cost: 0, upgradeBase: 50 },
    { id: "c2", loc: { x: -8, y: -57, z: 20 }, type: "carrier", label: "Курьер #2", cost: 400, upgradeBase: 200 },
    { id: "c3", loc: { x: -3, y: -57, z: 15 }, type: "carrier", label: "Курьер #3", cost: 1400, upgradeBase: 500 },
    { id: "f1", loc: { x: -12, y: -58, z: 9 }, type: "filter", label: "Фильтр #1", cost: 0, upgradeBase: 150 }
];
function getUpgradeCost(hologram) {
    const level = hologram.getDynamicProperty("level") ?? 1;
    const base = hologram.getDynamicProperty("upgradeBase") ?? 100;
    return level * base; // Цена растет от базы слота и текущего уровня
}
// Функция обновления текста голограммы
function updateHologramText(hologram) {
    const type = hologram.getDynamicProperty("shop_type");
    const baseLabel = hologram.getDynamicProperty("base_label") ?? "Магазин";
    const level = Number(hologram.getDynamicProperty("level") ?? 0);
    const cost = Number(hologram.getDynamicProperty("cost") ?? 0);

    if (level === 0) {
        const cost = hologram.getDynamicProperty("cost");
        hologram.nameTag = `${baseLabel}\n§6Цена: ${cost} монет`;
    } else if (level < 10) {
        const upgradeCost = getUpgradeCost(hologram)
        hologram.nameTag = `${baseLabel}\n§aУровень: ${level}/10\n§eУлучшить: ${upgradeCost} монет`;
    } else {
        hologram.nameTag = `${baseLabel}\n§b§lМАКС. УРОВЕНЬ`;
    }
}

system.runTimeout(() => {
    const dim = world.getDimension("overworld");

    for (const shop of SHOP_POSITIONS) {
        // ПРАВИЛЬНЫЙ синтаксис поиска для 1.21.0+
        const query = {
            location: shop.loc,
            maxDistance: 1,
            tags: ["shop_button"]
        };

        const existing = dim.getEntities(query);

        if (existing.length === 0) {
            // Явное создание вектора для спавна
            const spawnPos = {
                x: Number(shop.loc.x),
                y: Number(shop.loc.y),
                z: Number(shop.loc.z)
            };

            const hologram = dim.spawnEntity("minecraft:armor_stand", spawnPos);

            // Настройка свойств
            hologram.addTag("shop_button");
            hologram.setDynamicProperty("shop_id", shop.id);
            hologram.setDynamicProperty("shop_type", shop.type);
            hologram.setDynamicProperty("base_label", shop.label);
            hologram.setDynamicProperty("cost", Number(shop.cost));
            hologram.setDynamicProperty("upgradeBase", Number(shop.upgradeBase));
            hologram.setDynamicProperty("level", 0);

            updateHologramText(hologram);
        }
    }
}, 100);




world.afterEvents.playerInteractWithEntity.subscribe(ev => {
    const { target: hologram, player } = ev;
    if (!hologram.hasTag("shop_button")) return;

    const type = hologram.getDynamicProperty("shop_type");
    const level = hologram.getDynamicProperty("level") ?? 0;
    const money = Number(world.getDynamicProperty("money") ?? 0);

    // --- ПОКУПКА ---
    if (level === 0) {
        const cost = Number(hologram.getDynamicProperty("cost"));
        if (money < cost) return world.sendMessage("§cНедостаточно денег!");

        player.setDynamicProperty("money", money - cost);
        hologram.setDynamicProperty("level", 1);

        const spawned = hologram.dimension.spawnEntity(`water_tycoon:${type}`, {
            x: hologram.location.x, y: hologram.location.y, z: hologram.location.z + 2
        });

        // Привязываем сущность к кнопке для будущих апгрейдов
        spawned.setDynamicProperty("linked_shop_id", hologram.getDynamicProperty("shop_id"));

        player.sendMessage(`§aКуплено: ${type}!`);
    }
    // --- УЛУЧШЕНИЕ ---
    else if (level < 10) {
        const upgradeCost = getUpgradeCost(hologram)
        if (money < upgradeCost) return world.sendMessage(`§cНужно ${upgradeCost} монет!`);

        world.setDynamicProperty("money", money - upgradeCost);
        hologram.setDynamicProperty("level", level + 1);

        // Находим купленного моба рядом, чтобы повысить ему левел
        const minions = hologram.dimension.getEntities({
            type: `water_tycoon:${type}`,
            location: hologram.location,
            maxDistance: 10
        });

        for (const m of minions) {
            if (m.getDynamicProperty("linked_shop_id") === hologram.getDynamicProperty("shop_id")) {
                m.setDynamicProperty("level", level + 1);
            }
        }

        player.sendMessage(`§aУлучшено до уровня ${level + 1}!`);
    }

    updateHologramText(hologram);
});

