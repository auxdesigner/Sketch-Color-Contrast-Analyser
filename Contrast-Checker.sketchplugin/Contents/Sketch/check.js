// Calculates the color contrast of two layers 
// Read more about the Web Content Accessibility Guidelines 2.0 
// http://www.w3.org/WAI/WCAG20/quickref/#qr-visual-audio-contrast-contrast
// Based on these algorithms: http://gmazzocato.altervista.org/colorwheel/algo.php
// —————————————————————————————————————————
// Liu's addition: Integrate alpha value into the equation
// Using a formula from Lea Verou (member of W3C working group)
// When a semi-transparent color that described by rgba(R₁, G₁, B₁, A₁) is overlaid on a solid color rgb(R₂, G₂, B₂), the resulting solid color of the alpha blending operation will be rgb(R₁A₁ + R₂(1-A₁), G₁A₁ + G₂(1-A₁), B₁A₁ + B₂(1-A₁)) 
// https://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
// —————————————————————————————————————————
// This plugin expects a selection of two layers or a single layer that will be checked against the artboard’s background color.
// It works better when the background is opaque.
// If the background is transparent, the contrast ratio cannot be precise because it doesn't know what's underneath.

function onRun(context) {



	// Reference to the text layer if there is any
	var textLayer = null;

	// Setup

	var app = [NSApplication sharedApplication];
	var sketch = context.api();
	var document = sketch.selectedDocument;
	var selection = context.selection;
	var count = selection.count();
	var doc = NSDocumentController.sharedDocumentController().currentDocument();

	switch (count) {
		case 0:
			[app displayDialog:"Please select one or two layers." withTitle: "Color Contrast Analyser"]
		break;

		// If only 1 layer is selected, check against artboard
		// In this case, layer 1 is foreground
		case 1:
			var layer2 = selection[0];
			var color2 = getColorOf(layer2); //foreground
			var O2 = [[[layer2 style] contextSettings] opacity]; //foreground layer opacity
			

			if ([[doc currentPage] currentArtboard] != null) {
		
	 
				color1 = [[[doc currentPage] currentArtboard] backgroundColor]; //artboard
				var A1 = color1.alpha();  //artboard alpha , due to formula, name needs to be A1
				var A2 = color2.alpha() * O2;  //foreground alpha , due to formula, name needs to be A2
				

				var cr = getColorContrastOf(color1, color2, A1, A2); //

				showResult(cr);
			} else {
				[app displayDialog:"This plugin requires a single layer on an artboard or two selected layers to work." withTitle: "Color Contrast Analyser"]
			}

		break;


		// In this case, layer 1 is background	
		case 2:
			var layer1 = selection[0];  //background
			var layer2 = selection[1];	//foreground

			var color1 = getColorOf(layer1);  //background
			var color2 = getColorOf(layer2);  //foreground
			
			var O1 = [[[layer1 style] contextSettings] opacity]; // layer opacity (not fill opacity)
			var O2 = [[[layer2 style] contextSettings] opacity];
			
			var A1 = color1.alpha() * O1;  //background alpha (text alpha times layer alpha)
			var A2 = color2.alpha() * O2;  //foreground alpha

			var cr = getColorContrastOf(color1, color2, A1, A2);
			showResult(cr);
		break;
	}




	function getColorOf(layer) {
		var color = null;
		switch ([layer class]) {
			case MSTextLayer:
		    	color = layer.textColor();
				textLayer = layer;

				// Check if text layer has a fill color

				var fill = layer.style().fills().firstObject();
				if (fill != undefined && fill.isEnabled()) color = fill.color();
			break;
		  	default:
		    	var fill = layer.style().fills().firstObject();
				color = fill.color();
		    break;
		}
		return color;
	}

	function getColorContrastOf(color1, color2, A1, A2) {
		
			
		

		// get actual RGB Value without alpha
		V1R = color1.red() * 255;  
		V1G = color1.green() * 255;
		V1B = color1.blue() * 255;

		V2R = color2.red() * 255;  
		V2G = color2.green() * 255;
		V2B = color2.blue() * 255;

		// use formula to calculate actual RGB with alpha
		// The formula = rgb(R₁A₁ + R₂(1-A₁), G₁A₁ + G₂(1-A₁), B₁A₁ + B₂(1-A₁))
		V3R = (V2R * A2 + V1R * (1 - A2)).toFixed(0);
		V3G = (V2G * A2 + V1G * (1 - A2)).toFixed(0);
		V3B = (V2B * A2 + V1B * (1 - A2)).toFixed(0);

		V4R = (V1R * A1 + V2R * (1 - A1)).toFixed(0);
		V4G = (V1G * A1 + V2G * (1 - A1)).toFixed(0);
		V4B = (V1B * A1 + V2B * (1 - A1)).toFixed(0);



		// Color 1, get Luminosity

		L1R = color1.red();
		if (L1R <= 0.03928) {
			L1R = color1.red() / 12.92;
		} else {
			L1R = Math.pow(((L1R + 0.055)/1.055), 2.4)
		}

		L1G = color1.green();
		if (L1G <= 0.03928) {
			L1G = color1.green() / 12.92;
		} else {
			L1G = Math.pow(((L1G + 0.055)/1.055), 2.4)
		}

		L1B = color1.blue();
		if (L1B <= 0.03928) {
			L1B = color1.blue() / 12.92;
		} else {
			L1B = Math.pow(((L1B + 0.055)/1.055), 2.4)
		}

		// Color 2, get Luminosity

		L2R = color2.red();
		if (L2R <= 0.03928) {
			L2R = color2.red() / 12.92;
		} else {
			L2R = Math.pow(((L2R + 0.055)/1.055), 2.4)
		}

		L2G = color2.green();
		if (L2G <= 0.03928) {
			L2G = color2.green() / 12.92;
		} else {
			L2G = Math.pow(((L2G + 0.055)/1.055), 2.4)
		}

		L2B = color2.blue();
		if (L2B <= 0.03928) {
			L2B = color2.blue() / 12.92;
		} else {
			L2B = Math.pow(((L2B + 0.055)/1.055), 2.4)
		}


		// Color 3, get Luminosity

		L3R = V3R / 255;
		if (L3R <= 0.03928) {
			L3R = V3R / 255 / 12.92;
		} else {
			L3R = Math.pow(((V3R / 255 + 0.055)/1.055), 2.4)
		}

		L3G = V3G / 255;
		if (L3G <= 0.03928) {
			L3G = V3G / 255 / 12.92;
		} else {
			L3G = Math.pow(((V3G / 255 + 0.055)/1.055), 2.4)
		}

		L3B = V3B / 255;
		if (L3B <= 0.03928) {
			L3B = V3B / 255 / 12.92;
		} else {
			L3B = Math.pow(((V3B / 255 + 0.055)/1.055), 2.4)
		}

		// Color 4, get Luminosity

		L4R = V4R / 255;
		if (L4R <= 0.03928) {
			L4R = V4R / 255 / 12.92;
		} else {
			L4R = Math.pow(((V4R / 255 + 0.055)/1.055), 2.4)
		}

		L4G = V4G / 255;
		if (L4G <= 0.03928) {
			L4G = V4G / 255 / 12.92;
		} else {
			L4G = Math.pow(((V4G / 255 + 0.055)/1.055), 2.4)
		}

		L4B = V4B / 255;
		if (L4B <= 0.03928) {
			L4B = V4B / 255 / 12.92;
		} else {
			L4B = Math.pow(((V4B / 255 + 0.055)/1.055), 2.4)
		}


		var L1 = 0.2126 * L1R + 0.7152 * L1G + 0.0722 * L1B; //background without alpha
		var L2 = 0.2126 * L2R + 0.7152 * L2G + 0.0722 * L2B; //foreground without alpha
		var L3 = 0.2126 * L3R + 0.7152 * L3G + 0.0722 * L3B; //foreground with alpha 
		var L4 = 0.2126 * L4R + 0.7152 * L4G + 0.0722 * L4B; //background with alpha






		// Make sure L1 is the lighter color for formula

		if (L4 <= L3) {
			var temp = L3;
			L3 = L4;
			L4 = temp;
		}

		// Calculate contrast
		cr = ((L4 + 0.05) / (L3 + 0.05)).toFixed(1);
		return cr;
	}



	function showResult (cr) {
		// Check against AA / AAA
		var result = "🅾️ AA Failed";
		var fontSize = 14;

		// add a message when background has alpha
		var msg = "";
		if (A1!=1) {
			msg = " (Do you have transparent background? The formula won't be accurate because it doesn't know what's underneath.)";
		}


		if (textLayer != null) {
			var fontSize = textLayer.fontSize();
			var isBold = false;

			if (textLayer.fontPostscriptName().indexOf("Bold") != -1) {
				var isBold = true;
			}
			if (textLayer.fontPostscriptName().indexOf("Medium") != -1) {
				var isBold = true;
			}
		}
		if ((fontSize > 18 || (fontSize >= 14 && isBold)) && cr >=3) result = "✅ AA passed (large or bold/medium text)"
		if(cr >= 4.5) result = "✅ AA passed"

		if ((fontSize > 18 || (fontSize >= 14 && isBold)) && cr >=4.5) result = "✅ AAA passed (large or bold/medium text)"
		if(cr >= 7.0) result = "✅ AAA passed"

		// Show ratio
		[doc showMessage:result + "  " + cr + ":1" + msg]

	}

};

