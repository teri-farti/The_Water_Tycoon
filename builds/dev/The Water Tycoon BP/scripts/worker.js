import { world } from "@minecraft/server";

world.afterEvents.entityTick.subscribe(ev => {
    const worker = ev.entity;

    if (worker.typeId !== "water_tycoon:worker") return;

    const timer = worker.getComponent("minecraft:timer");

    if (!timer) return;

    // Когда таймер срабатывает
    if (timer.time === 0) {
        mineWater(worker);
    }
});

function mineWater(worker) {
    const level = worker.getDynamicProperty("level") ?? 1;
    const yieldAmount = 1 + level;

    for (let i = 0; i < yieldAmount; i++) {
        worker.dimension.spawnEntity("water_tycoon:raw_water", worker.location);
    }
}