import { world, system } from "@minecraft/server";

system.runInterval(() => {
    const dim = world.getDimension("overworld");
    const workers = dim.getEntities({ type: "water_tycoon:worker" });

    for (const worker of workers) {
        if (!worker.isValid()) continue;

        const level = Number(worker.getDynamicProperty("level") ?? 1);

        // ИНТЕРВАЛ: Уровень 1 = раз в 5 сек (100 тиков), Уровень 10 = раз в 1 сек (20 тиков)
        const interval = Math.max(20, 100 - (level * 8));

        // Проверяем текущий тик игры
        if (system.currentTick % interval === 0) {
            mineWater(worker, level);
        }
    }
}, 1); // Проверяем каждый тик

function mineWater(worker, level) {
    // Чтобы запустить анимацию ТОПОТА, используй это (если в RP привязано к атаке):
    worker.triggerEvent("water_tycoon:start_stomp");
    system.runTimeout(() => {
        if (worker.isValid()) worker.triggerEvent("water_tycoon:stop_stomp");
    }, 10);
    system.runTimeout(() => {
        if (!worker.isValid()) return;
        const yieldAmount = 1 + Math.floor(level / 2);
        for (let i = 0; i < yieldAmount; i++) {
            const spawnLoc = {
                x: worker.location.x + (Math.random() - 0.5),
                y: worker.location.y + 0.2,
                z: worker.location.z + (Math.random() - 0.5)
            };
            worker.dimension.spawnEntity("water_tycoon:raw_water", spawnLoc);
        }
    }, 5);
}

