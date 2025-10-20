
type BasePropertyDescriptor = Pick<PropertyDescriptor, 'configurable' | 'enumerable' | 'writable'>;

type PropertyDescriptorTyped<T> = BasePropertyDescriptor & ({
  value: T;
} | {
  get: () => T;
  set?: (value: T) => void;
});

type ExtensionMap<T extends object> = {
  [K in keyof T]: PropertyDescriptorTyped<T[K]>;
};

/** Type-safe version of `Object.defineProperties` */
export function extendObject<T extends object, TExtension extends object>(
  base: T,
  extensionDescriptorsMap: ExtensionMap<TExtension>,
) {
  return Object.defineProperties(base, extensionDescriptorsMap) as T & TExtension;
}
