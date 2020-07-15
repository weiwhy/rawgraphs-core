/**
 * options module.
 * @module options
 */

import get from "lodash/get";
import isString from "lodash/isString";
import isNumber from "lodash/isNumber";
import isArray from "lodash/isArray";
import { ValidationError, RAWError } from "./utils";
import mapValues from "lodash/mapValues";

export const baseOptions = {
  width: {
    type: "number",
    label: "Width (px)",
    default: 500,
    container: "width",
    group: "artboard",
  },

  height: {
    type: "number",
    label: "Height (px)",
    default: 500,
    container: "height",
    group: "artboard",
  },

  margins: {
    type: "number",
    label: "Margins (px)",
    default: 10,
    group: "artboard",
  },

  background: {
    type: "color",
    label: "Background",
    default: "#FFFFFF",
    container: { style: "background" },
    group: "artboard",
  },
};

const inputTypeToOptions = {
  text: {
    minLength: null,
    maxLength: null,
    options: null,
  },

  number: {
    step: "any",
    min: null,
    max: null,
    options: null,
  },

  range: {
    step: "any",
    min: 0,
    max: 1,
  },

  color: {
    options: null,
  },

  colorScale: {
    dimension: null,
  },

  boolean: {},

  //#TODO: makes sense?
  // margins: {

  // },
};

export function validateOptionsDefinition(definition) {}

export function getDefaultOptionsValues(definition) {
  return mapValues(definition, (field) => field.default);
}

export function getOptionsConfig(visualModelOptions) {
  return { ...baseOptions, ...(visualModelOptions || {}) };
}

export function validateValues(definition, values) {}

export function getEnabledOptions(definition, values) {}

///
export function getContainerOptions(optionsConfig, optionsValues) {
  const widthOptions = Object.keys(optionsConfig).filter(
    (name) => get(optionsConfig[name], "container") === "width"
  );
  const heightOptions = Object.keys(optionsConfig).filter(
    (name) => get(optionsConfig[name], "container") === "height"
  );
  const backgroundOptions = Object.keys(optionsConfig).filter(
    (name) =>
      get(optionsConfig[name], "container") === "style" &&
      get(optionsConfig[name], "container")["style"] === "background"
  );

  const width = widthOptions.reduce((acc, item) => {
    return acc + optionsValues[item] || 0;
  }, 0);
  const height = heightOptions.reduce((acc, item) => {
    return acc + optionsValues[item] || 0;
  }, 0);

  let style = {};

  if (backgroundOptions.length) {
    style["background"] = optionsValues[backgroundOptions[0]];
  }

  return { width, height, style };
}

function validateEnum(def, value) {
  const validValues = get(def, "options", []);
  if (validValues.length && validValues.indexOf(value) === -1) {
    throw new RAWError(`${value} is not a valid option`);
  }
  return value;
}

function validateText(def, value) {
  if (!isString(value)) {
    throw new RAWError("String expected");
  }

  validateEnum(value);

  const len = get(value, "length");
  const minLength = get(def, "minLength");
  if (minLength !== undefined && len < minLength) {
    throw new RAWError(`Min length is ${minLength}`);
  }
  const maxLength = get(def, "maxLength");
  if (maxLength !== undefined && len > maxLength) {
    throw new RAWError(`Max length is ${maxLength}`);
  }
  return value;
}

function validateNumber(def, value) {
  if (!isNumber(value)) {
    throw new RAWError("Number expected");
  }

  validateEnum(value);
  return value;
}

function validateRange(def, value) {
  return value;
}

function validateColor(def, value) {
  validateEnum(value);
  return value;
}

function validateColorScale(def, value) {
  return value;
}

function validateBoolean(def, value) {
  return value;
}

/**
 * default validators.
 * #TODO: registration approach?
 */
const validators = {
  text: validateText,
  number: validateNumber,
  range: validateRange,
  color: validateColor,
  colorScale: validateColorScale,
  boolean: validateBoolean,
};

/**
 * options validation and deserialization
 *
 * @param {object} optionsConfig
 * @param {object} optionsValues
 */
export function validateOptions(optionsConfig, optionsValues) {
  let validated = {};
  let errors = {};

  //validating not undefined values
  Object.keys(optionsValues)
    .filter((k) => optionsValues[k] !== undefined)
    .map((name) => {
      const optionConfig = optionsConfig[name];
      if (!optionConfig) {
        throw new ValidationError(`Visual option ${name} is not available`);
      }

      const validator = get(validators, optionConfig.type);
      if (validator) {
        try {
          validated[name] = validator(optionConfig, optionsValues[name]);
        } catch (err) {
          errors[name] = err.message;
        }
      } else {
        validated[name] = optionsValues[name];
      }
    });

  const errorNames = Object.keys(errors);
  if (errorNames.length) {
    throw new ValidationError(errors);
  }

  return validated;
}

export function getOptionsValues(definition, values) {
  const opts = getDefaultOptionsValues(definition);
  const allValues = {
    ...opts,
    ...values,
  };
  return validateOptions(definition, allValues);
}
