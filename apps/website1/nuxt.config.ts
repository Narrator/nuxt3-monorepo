// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
	nitro: {
		// preset: provider === 'aws_amplify' ? "./amplify" : undefined,
		preset:  "./amplify"
	},
	modules: ['nuxt3-websites-package']
})
