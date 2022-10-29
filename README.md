# Zajno's Toolbox – MobX

This library is an extension for [`@zajno/common`](https://github.com/Zajno/common-utils), which adds more tools but based on [MobX](https://mobx.js.org/) library.

All runtime dependencies are peer.

### Contents

* [Localization](./src/localization/LocalizationManager.ts) – attempt to have a simple runtime i18n manager

* [ViewModels]('./src/viewModels/index.ts') – useful for MVVM pattern

* Structures for caching & observing: [`PromiseCache`](./src/structures/promiseCache.ts), [`SubscribersMap`](./src/structures/subscribersMap.ts), [`SubscribersPromiseCache`](./src/structures/subscribersPromiseCache.ts)

* [`TransitionObserver`](./src/observing/transition.ts) – neat wrapper of mobx's `reaction`

* [`LazyObservable` & `LazyPromiseObservable`]('./src/lazy/observable.ts')
