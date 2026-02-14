import { world } from "@minecraft/server";

world.afterEvents.entityTick.subscribe(ev => {
    const carrier = ev.entity;

    if (carrier.typeId !== "water_tycoon:carrier") return;

    const timer = carrier.getComponent("minecraft:timer");
    if (!timer) return;

    // Когда таймер сработал
    if (timer.time === 0) {
        carrier.runCommand("function carrier/tick");
    }
});