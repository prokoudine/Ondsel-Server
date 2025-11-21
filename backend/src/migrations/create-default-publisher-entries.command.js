// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PublishedFileTargetMap, PublishedReleaseCadenceMap } from '../services/publisher/publisher.subdocs.schema.js';
import { siteConfigId } from '../services/site-config/site-config.schema.js';

export async function createDefaultPublisherEntriesCommand(app) {
    const publisherService = app.service('publisher');

    // Check if publisher entries already exist
    console.log(">>> checking for publisher entries");
    const existingEntries = await publisherService.find({
        query: {},
        paginate: false
    });

    if (existingEntries.length > 0) {
        console.log(">>> publisher entries already exist, skipping migration");
        return;
    }

    const userService = app.service('users');
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@local.test';
    const adminUsers = await userService.find({
        query: { email: adminEmail },
        paginate: false
    });

    let adminUser;
    if (adminUsers.length > 0) {
        adminUser = adminUsers[0];
    } else {
        console.log(">>> Warning: No admin user found, cannot create publisher entries");
        return;
    }

    const siteConfigService = app.service('site-config');
    let siteConfig;
    try {
        siteConfig = await siteConfigService.get(siteConfigId);
    } catch (error) {
        console.log(">>> Warning: Site config not found, cannot create publisher entries");
        return;
    }

    const stableVersion = '1.0.2';
    const weeklyDate = '2025.11.20';
    const stableReleaseDate = new Date("2025-08-06T03:02:17Z").getTime();
    const weeklyReleaseDate = new Date("2025-11-20T07:23:12Z").getTime();
    const baseUrl = 'https://github.com/FreeCAD/FreeCAD/releases/download';

    const stablePlatformMap = {
        [PublishedFileTargetMap.linuxX8664App]: `FreeCAD_${stableVersion}-conda-Linux-x86_64-py311.AppImage`,
        [PublishedFileTargetMap.linuxX8664AppSha]: `FreeCAD_${stableVersion}-conda-Linux-x86_64-py311.AppImage-SHA256.txt`,
        [PublishedFileTargetMap.linuxAarch64App]: `FreeCAD_${stableVersion}-conda-Linux-aarch64-py311.AppImage`,
        [PublishedFileTargetMap.linuxAarch64AppSha]: `FreeCAD_${stableVersion}-conda-Linux-aarch64-py311.AppImage-SHA256.txt`,
        [PublishedFileTargetMap.macMApp]: `FreeCAD_${stableVersion}-conda-macOS-arm64-py311.dmg`,
        [PublishedFileTargetMap.macMAppSha]: `FreeCAD_${stableVersion}-conda-macOS-arm64-py311.dmg-SHA256.txt`,
        [PublishedFileTargetMap.macIntelApp]: `FreeCAD_${stableVersion}-conda-macOS-x86_64-py311.dmg`,
        [PublishedFileTargetMap.macIntelAppSha]: `FreeCAD_${stableVersion}-conda-macOS-x86_64-py311.dmg-SHA256.txt`,
        [PublishedFileTargetMap.winX8664Installer]: `FreeCAD_${stableVersion}-conda-Windows-x86_64-installer-1.exe`,
        [PublishedFileTargetMap.winX8664InstallerSha]: `FreeCAD_${stableVersion}-conda-Windows-x86_64-installer-1.exe-SHA256.txt`,
    };

    const weeklyPlatformMap = {
        [PublishedFileTargetMap.linuxX8664App]: `FreeCAD_weekly-${weeklyDate}-Linux-x86_64-py311.AppImage`,
        [PublishedFileTargetMap.linuxAarch64App]: `FreeCAD_weekly-${weeklyDate}-Linux-aarch64-py311.AppImage`,
        [PublishedFileTargetMap.macMApp]: `FreeCAD_weekly-${weeklyDate}-macOS-arm64-py311.dmg`,
        [PublishedFileTargetMap.macIntelApp]: `FreeCAD_weekly-${weeklyDate}-macOS-x86_64-py311.dmg`,
        [PublishedFileTargetMap.winX8664ArchivedApp]: `FreeCAD_weekly-${weeklyDate}-Windows-x86_64-py311.7z`,
    };

    const getDownloadUrl = (target, cadence) => {
        let filename;
        if (cadence === PublishedReleaseCadenceMap.stable) {
            filename = stablePlatformMap[target] || `${target}`;
            return `${baseUrl}/${stableVersion}/${filename}`;
        } else {
            filename = weeklyPlatformMap[target] || `${target}`;
            return `${baseUrl}/weekly-${weeklyDate}/${filename}`;
        }
    };

    const stableEntries = [
        PublishedFileTargetMap.linuxX8664App,
        PublishedFileTargetMap.linuxX8664AppSha,
        PublishedFileTargetMap.linuxAarch64App,
        PublishedFileTargetMap.linuxAarch64AppSha,
        PublishedFileTargetMap.macMApp,
        PublishedFileTargetMap.macMAppSha,
        PublishedFileTargetMap.macIntelApp,
        PublishedFileTargetMap.macIntelAppSha,
        PublishedFileTargetMap.winX8664Installer,
        PublishedFileTargetMap.winX8664InstallerSha,
    ].map(target => ({
        target: target,
        releaseCadence: PublishedReleaseCadenceMap.stable,
        downloadUrl: getDownloadUrl(target, PublishedReleaseCadenceMap.stable),
        releaseDate: stableReleaseDate,
    }));

    const weeklyEntries = [
        PublishedFileTargetMap.linuxAarch64App,
        PublishedFileTargetMap.linuxX8664App,
        PublishedFileTargetMap.macMApp,
        PublishedFileTargetMap.macIntelApp,
        PublishedFileTargetMap.winX8664ArchivedApp,
    ].map(target => ({
        target: target,
        releaseCadence: PublishedReleaseCadenceMap.weekly,
        downloadUrl: getDownloadUrl(target, PublishedReleaseCadenceMap.weekly),
        releaseDate: weeklyReleaseDate,
    }));

    console.log(">>> creating default publisher entries");

    const allEntries = [...stableEntries, ...weeklyEntries];
    const result = await publisherService.create(allEntries, { user: adminUser });
    console.log(`>>> created ${result.length} default publisher entries`);
    console.log(`>>>   - ${stableEntries.length} stable release entries`);
    console.log(`>>>   - ${weeklyEntries.length} weekly build entries`);

    console.log(">>> updating site config stable release version");
    await siteConfigService.patch(siteConfigId, { stableReleaseVersion: stableVersion }, { user: adminUser });
    console.log(`>>> site config stable release version updated to: ${stableVersion}`);

    console.log(">>> default publisher entries setup completed");
}

