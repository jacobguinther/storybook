import { getStorybookInfo } from '@storybook/core-common';
import { readConfig, writeConfig } from '@storybook/csf-tools';
import dedent from 'ts-dedent';

import { JsPackageManagerFactory, type PackageManagerName } from './js-package-manager';

const logger = console;

/**
 * Remove the given addon package and remove it from main.js
 *
 * Usage:
 * - sb remove @storybook/addon-links
 */
export async function remove(addon: string, options: { packageManager: PackageManagerName }) {
  const { packageManager: pkgMgr } = options;

  const packageManager = JsPackageManagerFactory.getPackageManager({ force: pkgMgr });
  const packageJson = await packageManager.retrievePackageJson();
  const { mainConfig, configDir } = getStorybookInfo(packageJson);

  if (typeof configDir === 'undefined') {
    throw new Error(dedent`
      Unable to find storybook config directory
    `);
  }

  if (!mainConfig) {
    logger.error('Unable to find storybook main.js config');
    return;
  }
  const main = await readConfig(mainConfig);

  // remove from package.json
  logger.log(`Uninstalling ${addon}`);
  await packageManager.removeDependencies({ packageJson }, [addon]);

  // add to main.js
  logger.log(`Removing '${addon}' from main.js addons field.`);
  try {
    main.removeEntryFromArray(['addons'], addon);
    await writeConfig(main);
  } catch (err) {
    logger.warn(`Failed to remove '${addon}' from main.js addons field.`);
  }
}
