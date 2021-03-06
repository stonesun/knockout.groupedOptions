/*!
 * knockout-groupedOptions.js v0.11
 * 
 * Copyright (c) Andrew Jameson, www.Supertext.ch
 * Available under the MIT license: http://opensource.org/licenses/MIT
 */
 
// data-bind="groupedOptions: { 
//                              groups: { 
//                                          coll: [groups collection  |  required; no default],
//                                          label: [name of textual property  |  default: 'Label'],
//                                          options: {
//                                              coll: [name of the collection containing the <option> elements  |  default: 'Options']
//                                              text: [name of the textual property  |  default: 'Text'],
//                                              value: [name of the value property  |  default: 'Value']
//                                          },
//                                      }, 
//                              optionsCaption: [text to be displayed for the default <option>, i.e., "Please select"  |  default: <option> not rendered],
//								value: [the property (observable or otherwise) which references the selected <option> item.]
//                          }"
//
// eg, data-bind="groupedOptions: { groups: { coll: TextTypes, label: 'Label', options: { coll: 'Options', text: 'Text', val: 'Value' } }, optionsCaption: '- Please select -' }"
//
// if using the conventions then this example may be shortened to
// eg, data-bind="groupedOptions: { groups: { coll: TextTypes }, optionsCaption: '- Please select -' }"

// Note that neither of the above examples considers a subscribing property, i.e., a property whose value is pre-selected and which is updated when the user selection changes.


ko.bindingHandlers.groupedOptions = {
    "init": function (element) {
		
		// add a change handler to record when a selection has been made
        ko.utils.registerEventHandler(element, "change", function () {
		
            var property = ko.utils.domData.get(element, "property");	

			// if no property was specified (to bind the selected value to) then just exit here
			if (typeof property === "undefined") {
				return;
			}
			
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected) {
					var data = ko.utils.domData.get(node, "data");
					if (typeof property === "function") {
						property(data);
					} else if (typeof property === "string") {
						var viewModel = ko.dataFor(element);
						if (viewModel !== null) {
							viewModel[property] = data;
						}
					}
				}
            });
        });
    },
    "update": function(element, valueAccessor) {
	
		// a helper function that we'll use later
		function tryGetString(property, defaultVal) {
			return typeof property === "string" && property.length
				? property
				: defaultVal;
		}
	
		
        // Get the parameters

        var h = ko.utils.unwrapObservable(valueAccessor());

        var groups = h.groups,
            groupsCollection,
            groupsLabel = "Label",			// the convention for this property
            optionsCollProp = "Options",	// the convention for this property
            optionsTextProp = "Text",		// the convention for this property
            optionsValProp = "Value";		// the convention for this property

        if (typeof groups === "undefined" || !groups) {
            throw "The \"groupedOption\" binding requires a \"groups\" object be specified.";
        } else {
            groupsCollection = groups.coll;
        }
        if (!groupsCollection) {
            throw "The \"groupedOption\" binding's \"groups\" object requires that a collection (array or observableArray) be specified.";
        }
        if (typeof groups.label === "string" && groups.label.length) {
            groupsLabel = groups.label;
        }
        if (typeof groups.options === "object") {
            var optionsConfig = groups.options;
			optionsCollProp = tryGetString(optionsConfig.coll, optionsCollProp);
			optionsTextProp = tryGetString(optionsConfig.text, optionsTextProp);
			optionsValProp = tryGetString(optionsConfig.val, optionsValProp);
        }
		var selectedItem = h.value,
			selectedValue = ko.unwrap(selectedItem);
		if (typeof selectedItem === "function") {
			// this caters for the situation whereby the subscribing property *IS* an observable
			ko.utils.domData.set(element, "property", selectedItem);	// this records the subscribing property, i.e., the property which stores the selected item
		} else if (typeof selectedItem === "string") {
			// this caters for the situation whereby the subscribing property *IS NOT* an observable
			ko.utils.domData.set(element, "property", selectedItem);	// this records the name of the subscribing property, i.e., the property which stores the selected item
		}
		

        // find how many elements have already been added to 'element'
        var childCount = 0,
            children = element.childNodes,
            childMax = children.length;
        for (var c = 0; c < childMax; c++) {
            if (children[c].nodeType === 1) {	// nodeType === 1 means only consider HTML elements and ignore things like text nodes and comment nodes
                childCount++;
            }
        }

		
        // Default <option> element

        // if 'element' is currently empty then add the default <option> element
        if (!childCount) {
			var defaultText = h.optionsCaption;
 			if (defaultText && typeof defaultText === "string" && defaultText.length) {
        		var defaultOption = document.createElement("option");
				defaultOption.innerHTML = defaultText;
				element.appendChild(defaultOption);
        	}
        } else {
            // if 'element' is not empty then decrement childCount by 1, which represents the default <option> element
            childCount--;
        }


        // now it's time to loop through each <optgroup>
        // in this loop, i is set to the the index in the collection which marks the start of the newly-added items, skipping items already added (which were counted above)
        var coll = ko.utils.unwrapObservable(groupsCollection);
        childMax = coll.length;
        for (; childCount < childMax; childCount++) {

            var groupLabel = ko.utils.unwrapObservable(coll[childCount][groupsLabel]);

            // if there is no label for this <optgroup> then don't add the <optgroup>
            if (!groupLabel || !groupLabel.length) {
                continue;
            }

            var optGroup = document.createElement("optgroup");
            optGroup.setAttribute("label", groupLabel);

            // loop through each <option>
            // determine whether the <option>s collection is an array or an observableArray
            var options = ko.utils.unwrapObservable(coll[childCount][optionsCollProp]);
            for (var j = 0, jMax = options.length; j < jMax; j++) {

				var thisOption = options[j],
					optionText = ko.utils.unwrapObservable(thisOption[optionsTextProp]);

				// if there is no text for this <option> then don't add the <option>
				if (!optionText || !optionText.length) {
					continue;
				}

                var option = document.createElement("option");
                option.innerHTML = optionText;

                // add the 'value' attribute if it exists
                var val = ko.utils.unwrapObservable(thisOption[optionsValProp]);
                if (val && val.length) {
                    option.setAttribute("value", val);
                }
				
				// if this is the same object as the 'value' parameter then indicate so				
				if (thisOption === selectedValue) {
					option.setAttribute("selected", "selected");
				}
				
				// add the observable to this node so that we may retrieve this data in future
				ko.utils.domData.set(option, "data", thisOption);

                // now add this <option> to the parent <optgroup>
                optGroup.appendChild(option);
            }

            element.appendChild(optGroup);
        }

        return true;
    }
};
