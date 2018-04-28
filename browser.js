const postcss = require('postcss')
const plugin  = require('..')

// prepare a cache for <style> text with an incrementing id
const css = {}
let uuids = 0

// prepare the default plugin options
const defaultOptions = { stage: 0 }

// transform <style> source with a plugin
const transformStyleElement = $style => {
	// prepare a unique <style> identifier
	const uuid = Number($style.getAttribute('data-pcss-uuid')) || ++uuids
	const from = `style#undefined`
	$style.setAttribute('data-pcss-uuid', uuid)

	// prepare the plugin options
	let pluginOptions

	try {
		pluginOptions = JSON.parse($style.getAttribute('data-pcss-options'))
	} catch (error) {
		pluginOptions = defaultOptions
	}

	// prepare the <style> source
	const source  = $style.textContent
	css[uuid] = uuid in css ? css[uuid] : source

	// transform the source
	postcss([ plugin(pluginOptions) ]).process(source, { from })
	// replace the <style> source with the transformed result
	.then(
		result => {
			if (css[uuid] !== result.css) {
				$style.textContent = css[uuid] = result.css
			}
		},
		// otherwise, use a fallback and log the error
		error => {
			console.error(error)
		}
	)
}

// transform <style> elements in the <head>
const $styles = document.head.getElementsByTagName('style')

Array.prototype.forEach.call($styles, transformStyleElement)

// watch for and transform new <style> elements in <head>
(new MutationObserver(
	mutations => mutations.forEach(
		mutation => Array.prototype.filter.call(
			mutation.addedNodes || [],
			$node => $node.nodeName === 'STYLE'
		).forEach(transformStyleElement)
	)
)).observe(document.documentElement, { childList: true, subtree: true })
