import "./carrier.js";
import "./filter.js";
import "./money.js";
import "./sell_water.js";
import "./ui_shop.js";
import "./worker.js";
import { system, world } from "@minecraft/server";

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
    const loc = entity.location;

    if (entity.typeId === "water_tycoon:worker") {
        world.setDynamicProperty("worker_pos", `${Math.floor(loc.x)} ${Math.floor(loc.y)} ${Math.floor(loc.z)}`);
    }
    if (entity.typeId === "water_tycoon:filter") {
        world.setDynamicProperty("filter_pos", `${Math.floor(loc.x)} ${Math.floor(loc.y)} ${Math.floor(loc.z)}`);
    }
});
const SHOP_POSITIONS = [
    { id: "w1", loc: { x: -25, y: -58, z: 2 }, type: "worker", label: "Рабочий #1", cost: 50 },
    { id: "w2", loc: { x: -20, y: -56, z: 20 }, type: "worker", label: "Рабочий #2", cost: 500 },
    { id: "w3", loc: { x: -2, y: -56, z: -1 }, type: "worker", label: "Рабочий #3", cost: 1500 },
    { id: "c1", loc: { x: -8, y: -57, z: 15 }, type: "carrier", label: "Курьер #1", cost: 40 },
    { id: "c2", loc: { x: -8, y: -57, z: 20 }, type: "carrier", label: "Курьер #2", cost: 400 },
    { id: "c3", loc: { x: -3, y: -57, z: 15 }, type: "carrier", label: "Курьер #3", cost: 1400 },
];

// Функция обновления текста голограммы
function updateHologramText(hologram) {
    const id = hologram.getDynamicProperty("shop_id");
    const type = hologram.getDynamicProperty("shop_type");
    const baseLabel = hologram.getDynamicProperty("base_label");
    const level = hologram.getDynamicProperty("level") ?? 0;

    if (level === 0) {
        const cost = hologram.getDynamicProperty("cost");
        hologram.nameTag = `${baseLabel}\n§6Цена: ${cost} монет`;
    } else if (level < 10) {
        const upgradeCost = level * 100; // Пример формулы цены улучшения
        hologram.nameTag = `${baseLabel}\n§aУровень: ${level}/10\n§eУлучшить: ${upgradeCost} монет`;
    } else {
        hologram.nameTag = `${baseLabel}\n§b§lМАКС. УРОВЕНЬ`;
    }
}

system.runTimeout(() => {
    const dim = world.getDimension("overworld");
    for (const shop of SHOP_POSITIONS) {
        const existing = dim.getEntities({ location: shop.loc, maxDistance: 1, tags: ["shop_button"] });
        if (existing.length === 0) {
            const hologram = dim.spawnEntity("minecraft:armor_stand", shop.loc);
            hologram.addTag("shop_button");
            // Настройка отображения
            hologram.nameTag = shop.label;
            // hologram.alwaysShowNameTag = true; // Чтобы было видно ВСЕГДА (может не работать на стойках в некоторых версиях)

            // Сохраняем данные в саму стойку
            hologram.setDynamicProperty("shop_id", shop.id);
            hologram.setDynamicProperty("shop_type", shop.type);
            hologram.setDynamicProperty("base_label", shop.label);
            hologram.setDynamicProperty("cost", Number(shop.cost));
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
    const money = Number(player.getDynamicProperty("money") ?? 0);

    // --- ПОКУПКА ---
    if (level === 0) {
        const cost = Number(hologram.getDynamicProperty("cost"));
        if (money < cost) return player.sendMessage("§cНедостаточно денег!");

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
        const upgradeCost = level * 100;
        if (money < upgradeCost) return player.sendMessage(`§cНужно ${upgradeCost} монет!`);

        player.setDynamicProperty("money", money - upgradeCost);
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

