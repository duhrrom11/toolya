'use strict';

// Optional Promptfoo demonstration: ONLY serves checked-in synthetic fixture text.
// No model, network, credentials, production data or prompt evaluation.
const path = require('node:path');
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync(path.join(__dirname,'../fixtures.json'),'utf8'));

module.exports = class ToolyaFixtureProvider {
  id() { return 'toolya:synthetic-productivity-fixture'; }
  async callApi(_prompt, context) {
    const name = context?.vars?.fixture;
    const item = data.cases.find(x=>x.id===name && x.expectedPass===true);
    if (!item) return {error:'Unknown or nonpositive synthetic fixture.'};
    return {output:item.output};
  }
};
