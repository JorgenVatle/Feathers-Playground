import Vue from 'vue';
import Vuex from 'vuex';
import feathersVuex, { initAuth } from 'feathers-vuex';
import feathers from '@feathersjs/feathers';
import authConfigure from '@feathersjs/authentication-client';
import socketio from '@feathersjs/socketio-client';
import io from 'socket.io-client';
import { CookieStorage } from 'cookie-storage';

/*
* Initial setup
*/
const socket = io('http://localhost:3030', { transports: ['websocket'] });

export const feathersClient = feathers().configure(socketio(socket)).configure(
    authConfigure({
        storage: new CookieStorage(),
    }),
);

const FV = feathersVuex(feathersClient, {
    idField: 'id',
});

export const service = FV.service;

/*
* Register $Feathers-Vuex as Vue plugin
*/
if ('true' === 'true') {
    Vue.use(FV.FeathersVuex);
}

/*
* Register files in ~/store/services as separate service modules
* Each file will export { store, hooks }
* So that we can register the hooks too
*/
const folder = require.context('~/store/services', false, /.js$/);
const allNames = folder.keys().map((key) => key.substring(2, key.length - 3));
const filteredNames = allNames.filter((name) => name !== 'auth');
const servicePlugins = () => {
    const plugins = filteredNames.map((name) => {
        let { store, hooks, options } = require('~/store/services/' + name);
        feathersClient.service(name).hooks(hooks || []);
        return service(name, Object.assign(store || {}, options || {}));
    });
    if (!filteredNames.includes('users')) {
        plugins.push(service('users'));
    }
    return plugins;
};

/*
* Prepare auth plugin separately
*/
const authStore = Object.assign(
    {
        state: {
            publicPages: [],
        },
        actions: {
            onInitAuth({ dispatch }, payload) {
                dispatch('authenticate')
                    .then((result) => {
                        // handle success like a boss
                    })
                    .catch((error) => {
                        // handle error like a boss
                    });
            },
        },
        userService: 'users',
    },
    allNames.includes('auth') ? require('~/store/services/auth').store : {},
);

/*
* Prepare default store object for new Vuex.Store
* When ready, nuxtServerInit will dispatch default authenticate action
* User can replace it in store/index.js
*/
const defaultStore = {
    actions: {
        nuxtServerInit({ commit, dispatch }, { req }) {
            return initAuth({
                commit,
                dispatch,
                req,
                moduleName: 'auth',
                cookieName: 'feathers-jwt',
            }).then((result) => dispatch('auth/onInitAuth'));
        },
    },
};

/*
* Actual `new Vuex.Store` handler
* Plugins are an array so we need to deal with them separately
*/
export const createStore = (val = {}) => {
    let newStore = Object.assign({}, val);
    delete newStore.plugins;
    let newPlugins = val.plugins || [];
    return () => {
        return new Vuex.Store({
            ...Object.assign(defaultStore, newStore),
            plugins: [
                ...servicePlugins(),
                FV.auth(authStore),
            ].concat(newPlugins),
        });
    };
};
