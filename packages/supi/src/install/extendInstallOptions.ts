import logger from '@pnpm/logger'
import { IncludedDependencies } from '@pnpm/modules-yaml'
import { LocalPackages } from '@pnpm/resolver-base'
import { StoreController } from '@pnpm/store-controller-types'
import { ReadPackageHook, Registries } from '@pnpm/types'
import { DEFAULT_REGISTRIES, normalizeRegistries } from '@pnpm/utils'
import path = require('path')
import { Shrinkwrap } from 'pnpm-shrinkwrap'
import { ImportersOptions } from '../getContext'
import pnpmPkgJson from '../pnpmPkgJson'
import { ReporterFunction } from '../types'

export interface BaseInstallOptions {
  allowNew?: boolean,
  forceSharedShrinkwrap?: boolean,
  frozenShrinkwrap?: boolean,
  preferFrozenShrinkwrap?: boolean,
  shamefullyFlatten?: boolean,
  storeController: StoreController,
  store: string,
  reporter?: ReporterFunction,
  shrinkwrap?: boolean,
  shrinkwrapOnly?: boolean,
  force?: boolean,
  update?: boolean,
  depth?: number,
  repeatInstallDepth?: number,
  shrinkwrapDirectory?: string,
  rawNpmConfig?: object,
  verifyStoreIntegrity?: boolean,
  engineStrict?: boolean,
  nodeVersion?: string,
  packageManager?: {
    name: string,
    version: string,
  },
  pruneShrinkwrapImporters?: boolean,
  hooks?: {
    readPackage?: ReadPackageHook,
    afterAllResolved?: (shr: Shrinkwrap) => Shrinkwrap,
  },
  saveExact?: boolean,
  savePrefix?: string,
  saveProd?: boolean,
  saveDev?: boolean,
  saveOptional?: boolean,
  sideEffectsCache?: boolean,
  sideEffectsCacheReadonly?: boolean,
  strictPeerDependencies?: boolean,
  importers?: ImportersOptions[],
  include?: IncludedDependencies,
  independentLeaves?: boolean,
  ignoreCurrentPrefs?: boolean,
  ignoreScripts?: boolean,
  childConcurrency?: number,
  userAgent?: string,
  unsafePerm?: boolean,
  registries?: Registries,
  lock?: boolean,
  lockStaleDuration?: number,
  tag?: string,
  locks?: string,
  ownLifecycleHooksStdio?: 'inherit' | 'pipe',
  localPackages?: LocalPackages,
  pruneStore?: boolean,
}

export type InstallOptions = BaseInstallOptions & {
  bin?: string,
  prefix?: string,
}

export type StrictInstallOptions = BaseInstallOptions & {
  allowNew: boolean,
  forceSharedShrinkwrap: boolean,
  frozenShrinkwrap: boolean,
  preferFrozenShrinkwrap: boolean,
  shamefullyFlatten: boolean,
  shrinkwrap: boolean,
  shrinkwrapDirectory: string,
  shrinkwrapOnly: boolean,
  force: boolean,
  update: boolean,
  depth: number,
  repeatInstallDepth: number,
  engineStrict: boolean,
  nodeVersion: string,
  rawNpmConfig: object,
  verifyStoreIntegrity: boolean,
  packageManager: {
    name: string,
    version: string,
  },
  pruneShrinkwrapImporters: boolean,
  hooks: {
    readPackage?: ReadPackageHook,
  },
  saveExact: boolean,
  savePrefix: string,
  saveProd: boolean,
  saveDev: boolean,
  saveOptional: boolean,
  sideEffectsCache: boolean,
  sideEffectsCacheReadonly: boolean,
  strictPeerDependencies: boolean,
  importers: ImportersOptions[],
  include: IncludedDependencies,
  independentLeaves: boolean,
  ignoreCurrentPrefs: boolean,
  ignoreScripts: boolean,
  childConcurrency: number,
  userAgent: string,
  lock: boolean,
  registries: Registries,
  lockStaleDuration: number,
  tag: string,
  locks: string,
  unsafePerm: boolean,
  ownLifecycleHooksStdio: 'inherit' | 'pipe',
  localPackages: LocalPackages,
  pruneStore: boolean,
}

const defaults = async (opts: InstallOptions) => {
  const packageManager = opts.packageManager || {
    name: pnpmPkgJson.name,
    version: pnpmPkgJson.version,
  }
  return {
    allowNew: true,
    childConcurrency: 5,
    depth: 0,
    engineStrict: false,
    force: false,
    forceSharedShrinkwrap: false,
    frozenShrinkwrap: false,
    hooks: {},
    ignoreCurrentPrefs: false,
    ignoreScripts: false,
    importers: [{
      bin: opts.bin,
      prefix: opts.prefix || process.cwd(),
    }],
    include: {
      dependencies: true,
      devDependencies: true,
      optionalDependencies: true,
    },
    independentLeaves: false,
    localPackages: {},
    lock: true,
    locks: path.join(opts.store, '_locks'),
    lockStaleDuration: 5 * 60 * 1000, // 5 minutes
    nodeVersion: process.version,
    ownLifecycleHooksStdio: 'inherit',
    packageManager,
    preferFrozenShrinkwrap: true,
    pruneShrinkwrapImporters: false,
    pruneStore: false,
    rawNpmConfig: {},
    registries: DEFAULT_REGISTRIES,
    repeatInstallDepth: -1,
    saveDev: false,
    saveExact: false,
    saveOptional: false,
    savePrefix: '^',
    saveProd: false,
    shamefullyFlatten: false,
    shrinkwrap: true,
    shrinkwrapDirectory: opts.shrinkwrapDirectory || opts.prefix || process.cwd(),
    shrinkwrapOnly: false,
    sideEffectsCache: false,
    sideEffectsCacheReadonly: false,
    store: opts.store,
    storeController: opts.storeController,
    strictPeerDependencies: false,
    tag: 'latest',
    unsafePerm: process.platform === 'win32' ||
      process.platform === 'cygwin' ||
      !(process.getuid && process.setuid &&
        process.getgid && process.setgid) ||
      process.getuid() !== 0,
    update: false,
    userAgent: `${packageManager.name}/${packageManager.version} npm/? node/${process.version} ${process.platform} ${process.arch}`,
    verifyStoreIntegrity: true,
  } as StrictInstallOptions
}

export default async (
  opts: InstallOptions,
): Promise<StrictInstallOptions> => {
  if (opts) {
    for (const key in opts) {
      if (opts[key] === undefined) {
        delete opts[key]
      }
    }
  }
  const defaultOpts = await defaults(opts)
  const extendedOpts = {
    ...defaultOpts,
    ...opts,
    store: defaultOpts.store,
  }
  if (!extendedOpts.shrinkwrap && extendedOpts.shrinkwrapOnly) {
    throw new Error('Cannot generate a shrinkwrap.yaml because shrinkwrap is set to false')
  }
  if (extendedOpts.userAgent.startsWith('npm/')) {
    extendedOpts.userAgent = `${extendedOpts.packageManager.name}/${extendedOpts.packageManager.version} ${extendedOpts.userAgent}`
  }
  extendedOpts.registries = normalizeRegistries(extendedOpts.registries)
  extendedOpts.rawNpmConfig['registry'] = extendedOpts.registries.default // tslint:disable-line:no-string-literal
  // if sideEffectsCacheReadonly is true, sideEffectsCache is necessarily true too
  if (extendedOpts.sideEffectsCache && extendedOpts.sideEffectsCacheReadonly) {
    logger.warn({
      message: "--side-effects-cache-readonly turns on side effects cache too, you don't need to specify both",
      prefix: extendedOpts.shrinkwrapDirectory || process.cwd(),
    })
  }
  extendedOpts.sideEffectsCache = extendedOpts.sideEffectsCache || extendedOpts.sideEffectsCacheReadonly
  return extendedOpts
}
