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
    // First, check if the target actually exists
    if (target && target.typeId && target.typeId.includes("water_tycoon:")) {
        target.clearVelocity();
    }
});

system.afterEvents.scriptEventReceive.subscribe(ev => {
    if (ev.id === "water_tycoon:reset") {
        for (const player of world.getAllPlayers()) {
            player.setDynamicProperty("money", 100);
            player.sendMessage("§e[System] Your balance has been successfully reset and fixed!");
        }
    }
});

world.afterEvents.entitySpawn.subscribe(ev => {
    const entity = ev.entity;
    const shopId = entity.getDynamicProperty("linked_shop_id");
    if (!shopId) return;

    // Save the position of the specific unit (w1_pos, w2_pos, f1_pos, etc.)
    const loc = entity.location;
    const posStr = `${Math.floor(loc.x)} ${Math.floor(loc.y)} ${Math.floor(loc.z)}`;
    world.setDynamicProperty(`${shopId}_pos`, posStr);
});

const SHOP_POSITIONS = [
    { id: "w1", loc: { x: -25, y: -58, z: 2 }, type: "worker", label: "Worker #1", cost: 0, upgradeBase: 100 },
    { id: "w2", loc: { x: -20, y: -56, z: 20 }, type: "worker", label: "Worker #2", cost: 500, upgradeBase: 300 },
    { id: "w3", loc: { x: -2, y: -56, z: -1 }, type: "worker", label: "Worker #3", cost: 1500, upgradeBase: 800 },
    { id: "c1", loc: { x: -8, y: -57, z: 15 }, type: "carrier", label: "Carrier #1", cost: 0, upgradeBase: 50 },
    { id: "c2", loc: { x: -8, y: -57, z: 20 }, type: "carrier", label: "Carrier #2", cost: 400, upgradeBase: 200 },
    { id: "c3", loc: { x: -3, y: -57, z: 15 }, type: "carrier", label: "Carrier #3", cost: 1400, upgradeBase: 500 },
    { id: "f1", loc: { x: -12, y: -58, z: 9 }, type: "filter", label: "Filter #1", cost: 0, upgradeBase: 150 }
];

function getUpgradeCost(hologram) {
    const level = hologram.getDynamicProperty("level") ?? 1;
    const base = hologram.getDynamicProperty("upgradeBase") ?? 100;
    return level * base; // Price increases based on slot base and current level
}

// Function to update hologram text
function updateHologramText(hologram) {
    const type = hologram.getDynamicProperty("shop_type");
    const baseLabel = hologram.getDynamicProperty("base_label") ?? "Shop";
    const level = Number(hologram.getDynamicProperty("level") ?? 0);
    const cost = Number(hologram.getDynamicProperty("cost") ?? 0);

    if (level === 0) {
        const cost = hologram.getDynamicProperty("cost");
        hologram.nameTag = `${baseLabel}\n§6Price: ${cost} coins`;
    } else if (level < 10) {
        const upgradeCost = getUpgradeCost(hologram);
        hologram.nameTag = `${baseLabel}\n§aLevel: ${level}/10\n§eUpgrade: ${upgradeCost} coins`;
    } else {
        hologram.nameTag = `${baseLabel}\n§b§lMAX LEVEL`;
    }
}

system.runTimeout(() => {
    const dim = world.getDimension("overworld");

    for (const shop of SHOP_POSITIONS) {
        // Correct search syntax for 1.21.0+
        const query = {
            location: shop.loc,
            maxDistance: 1,
            tags: ["shop_button"]
        };

        const existing = dim.getEntities(query);

        if (existing.length === 0) {
            const spawnPos = {
                x: Number(shop.loc.x),
                y: Number(shop.loc.y),
                z: Number(shop.loc.z)
            };

            const hologram = dim.spawnEntity("minecraft:armor_stand", spawnPos);

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

    // --- PURCHASE ---
    if (level === 0) {
        const cost = Number(hologram.getDynamicProperty("cost"));
        if (money < cost) return world.sendMessage("§cNot enough money!");

        player.setDynamicProperty("money", money - cost);
        hologram.setDynamicProperty("level", 1);

        const spawned = hologram.dimension.spawnEntity(`water_tycoon:${type}`, {
            x: hologram.location.x, y: hologram.location.y, z: hologram.location.z + 2
        });

        spawned.setDynamicProperty("linked_shop_id", hologram.getDynamicProperty("shop_id"));

        player.sendMessage(`§aPurchased: ${type}!`);
    }
    // --- UPGRADE ---
    else if (level < 10) {
        const upgradeCost = getUpgradeCost(hologram);
        if (money < upgradeCost) return world.sendMessage(`§cYou need ${upgradeCost} coins!`);

        world.setDynamicProperty("money", money - upgradeCost);
        hologram.setDynamicProperty("level", level + 1);

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

        player.sendMessage(`§aUpgraded to level ${level + 1}!`);
    }

    updateHologramText(hologram);
});
