import { Ability } from '@casl/ability'

export const abilityInstance = new Ability()

export const abilityPlugin = (store) => {

  abilityInstance.update(store.state.rules)

  return store.subscribe((mutation) => {
    switch (mutation.type) {
      case 'auth/setUser':
        // store.$router.app.$storyboard.mainStory.info('casl:store:plugin', 'user logged in, setting access rules')
        store.app.api.storyboard.mainStory.trace('casl:vuex', '@store/plugins/casl update permissions')
        abilityInstance.update(mutation.payload.rules)
        break
      case 'auth/logout':
        console.log('@store/plugins/casl user logged out, REsetting access rules')
        abilityInstance.update([{ actions: 'read', subject: 'all' }])
        break
    }
  })
}
