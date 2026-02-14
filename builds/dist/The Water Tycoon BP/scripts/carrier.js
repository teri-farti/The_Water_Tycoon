import { world, system } from "@minecraft/server";

system.runInterval(() => {
    const dim = world.getDimension("overworld");
    const carriers = dim.getEntities({ type: "water_tycoon:carrier" });

    for (const carrier of carriers) {
        if (!carrier.isValid()) continue;

        const myId = carrier.getDynamicProperty("linked_shop_id"); // Например "c1"
        const partnerId = myId?.replace("c", "w"); // "w1"

        // Получаем координаты: если есть вода - к фильтру f1, если нет - к своему рабочему
        const targetPosStr = carrier.getDynamicProperty("has_water")
            ? world.getDynamicProperty("f1_pos")
            : world.getDynamicProperty(`${partnerId}_pos`);

        if (!targetPosStr) continue;
        const target = parseLoc(targetPosStr);

        const level = Number(carrier.getDynamicProperty("level") ?? 1);
        const hasWater = carrier.getDynamicProperty("has_water") ?? false;

        const dx = target.x - carrier.location.x;
        const dz = target.z - carrier.location.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 1.5) {
            carrier.runCommandAsync(`tp @s ~ ~ ~ facing ${target.x} ${target.y} ${target.z}`);

            const speedBoost = (level - 1) * 0.05;
            const speed = 0.25 + speedBoost;
            const velocity = {
                x: (dx / dist) * speed,
                y: carrier.getVelocity().y,
                z: (dz / dist) * speed
            };

            const blockInFront = dim.getBlock({
                x: carrier.location.x + (dx / dist) * 0.8,
                y: carrier.location.y + 0.5,
                z: carrier.location.z + (dz / dist) * 0.8
            });

            if (blockInFront && !blockInFront.isAir) {
                velocity.y = 0.9; // Прыжок
            }
            carrier.applyImpulse(velocity);
        }

        if (dist < 2.5) {
            if (!hasWater) {
                const drops = dim.getEntities({ type: "water_tycoon:raw_water", location: carrier.location, maxDistance: 4 });
                if (drops.length > 0) {
                    drops[0].remove();
                    carrier.setDynamicProperty("has_water", true);
                    carrier.runCommandAsync("replaceitem entity @s slot.weapon.mainhand 0 water_tycoon:raw_water");
                }
            } else {
                carrier.setDynamicProperty("has_water", false);
                carrier.runCommandAsync("replaceitem entity @s slot.weapon.mainhand 0 air");
                sellWater(carrier); // ПЕРЕДАЕМ КУРЬЕРА
            }
        }
    }
}, 3);

function parseLoc(str) {
    const s = str.split(" ");
    return { x: Number(s[0]), y: Number(s[1]), z: Number(s[2]) };
}

function sellWater(carrier) {
    const player = world.getAllPlayers()[0];
    if (!player) return;

    const carrierLevel = Number(carrier.getDynamicProperty("level") ?? 1);
    const filters = world.getDimension("overworld").getEntities({ type: "water_tycoon:filter" });
    const filterLevel = filters.length > 0 ? Number(filters[0].getDynamicProperty("level") ?? 1) : 1;

    const myId = carrier.getDynamicProperty("linked_shop_id");
    const partnerId = myId?.replace("c", "w");
    const workers = world.getDimension("overworld").getEntities({ type: "water_tycoon:worker" });
    const myWorker = workers.find(w => w.getDynamicProperty("linked_shop_id") === partnerId);
    const workerLevel = myWorker ? Number(myWorker.getDynamicProperty("level") ?? 1) : 1;

    const baseReward = 15 + (workerLevel * 5);
    const totalReward = Math.floor(baseReward * (1 + filterLevel * 0.2) + (carrierLevel * 2));

    const money = Number(world.getDynamicProperty("money") ?? 0);
    world.setDynamicProperty("money", money + totalReward);
    player.onScreenDisplay.setActionBar(`§a+${totalReward} монет §7(Рабочий Ур.${workerLevel})`);
}
