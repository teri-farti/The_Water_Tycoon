import { world, system } from "@minecraft/server";

// 1. Инициализация ОБЩИХ денег при загрузке (если их нет)
system.runTimeout(() => {
    if (world.getDynamicProperty("money") === undefined) {
        world.setDynamicProperty("money", 0);
    }
}, 20);

// 2. Отображение ОБЩИХ денег всем игрокам
system.runInterval(() => {
    // Считываем общие деньги мира
    const rawMoney = world.getDynamicProperty("money");
    const globalMoney = typeof rawMoney === "number" ? rawMoney : 0;

    for (const player of world.getAllPlayers()) {
        player.onScreenDisplay.setActionBar(`§eMoney: §6${globalMoney}`);
    }
}, 10);
