const postcss = require('postcss')
const plugin  = require('..')

// prepare a cache for the <style> element and cached <style> text
let $style, currentCSS

// prepare the reference to the <pre> result element
let $result

// prepare the targetted codepen class name
const codepenClass = 'cp-pen-styles'

// prepare the process options
const processOptions = { from: codepenClass, stringifier: postcssHTMLStringifier }

// prepare the plugin options with defaults
const pluginOptions = {
	variables: {
		'--some-custom-padding': '20px',
		'--another-custom-width': '600px'
	}
}

// transform <style> source with a plugin
function transformStyleElement () {
	if ($style) {
		// prepare the <style> source
		const source = $style.textContent.trim()
		currentCSS = currentCSS || source

		// transform the source
		postcss([ plugin(pluginOptions) ]).process(source, processOptions)
		// replace the <style> source with the transformed result
		.then(
			result => {
				const resultCSS = result.css

				if (currentCSS !== resultCSS) {
					$result.innerHTML = currentCSS = resultCSS
				}
			},
			// otherwise, use a fallback and log the error
			error => {
				console.error(error)
			}
		)
		// remove <style class={codepenClass}> or <style> from the document
		.then(() => {
			if ($style.parentNode) {
				$style.parentNode.removeChild($style)
			}
		})
	}
}

// initialize the dom
function initDOM () {
	// prepare the fragment used to create all of the dom
	const $fragment = document.createDocumentFragment()

	// prepare the <pre> result element
	$result = $fragment.appendChild(document.createElement('pre'))

	$result.className = 'css-root'

	// add the fragment to the <body>
	document.body.appendChild($fragment)

	// prepare all <style> elements in the <head>
	const $styles = document.head.getElementsByTagName('style')

	// prepare the first <style class={codepenClass}> or <style> in <head>
	$style = Array.prototype.filter.call($styles, $currentStyle => $currentStyle.className === codepenClass)
	.concat($styles[0])[0] || $style

	// transform the source
	if (typeof transformStyleElement === 'function') {
		transformStyleElement()
	}

	// watch for and transform any new <style class={codepenClass}> in <head>
	(
		new MutationObserver(
			mutations => mutations.forEach(
				mutation => {
					$style = [].filter.call(mutation.addedNodes || [], $currentStyle => $currentStyle.nodeName === 'STYLE' && $currentStyle.className === codepenClass)[0] || $style

					transformStyleElement()
				}
			)
		)
	).observe(document.head, { childList: true })
}

// stringify CSS as syntax-highlighted HTML
function postcssHTMLStringifier (root, builder) {
	function toString(node, semicolon) {
		if ('atrule' === node.type) {
			return atruleToString(node, semicolon)
		} if ('rule' === node.type) {
			return ruleToString(node, semicolon)
		} else if ('decl' === node.type) {
			return declToString(node, semicolon)
		} else if ('comment' === node.type) {
			return commentToString(node, semicolon)
		} else {
			return node.nodes ? node.nodes.map(childNodes => toString(childNodes, semicolon)).join('') : node.toString()
		}
	}

	function atruleToString(atrule, semicolon) {
		return `${atrule.raws.before||''}<span class=css-atrule><span class=css-atrule-name>@${atrule.name}</span>${atrule.raws.afterName||''}<span class=css-atrule-params>${atrule.params}</span>${atrule.raws.between||''}${atrule.nodes?`<span class=css-block>{${atrule.nodes.map(node => toString(node, atrule.raws.semicolon)).join('')}${atrule.raws.after||''}}</span>`:semicolon?';':''}</span>`
	}

	function ruleToString(rule) {
		return `${rule.raws.before||''}<span class=css-rule><span class=css-selector>${rule.selector}</span>${rule.raws.between||''}<span class=css-block>{${rule.nodes.map(node => toString(node, rule.raws.semicolon)).join('')}${rule.raws.after||''}}</span></span>`
	}

	function declToString(decl, semicolon) {
		return `${decl.raws.before || ''}<span class=css-declaration><span class=css-property>${decl.prop}</span>${decl.raws.between || ':'}<span class=css-value>${decl.value}</span>${semicolon?';':''}</span>`
	}

	function commentToString(comment) {
		return `${comment.raws.before}<span class=css-comment>/*${comment.raws.left}${comment.text}${comment.raws.right}*/</span>`
	}

	builder(
		toString(root)
	)
}

// on document ready, initialize the dom
document.addEventListener('DOMContentLoaded', initDOM)
