/**
 * Node CommonJS: strict mode + export glue so the user only writes {@code class Solution { ... }}.
 */
export const JAVASCRIPT_PRELUDE = `"use strict";

`;

export const JAVASCRIPT_MODULE_EPILOGUE = `

module.exports = { Solution };
`;
