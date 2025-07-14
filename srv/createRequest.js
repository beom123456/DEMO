const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

  this.before('CREATE', 'Request', async (req) => {
    const db = await cds.connect.to('db');
    const tx = db.transaction(req);

    // 현재 가장 큰 request_number 조회
    const result = await tx.run(`
      SELECT MAX(request_number) as maxNum FROM demo_request_Request
    `);

    const maxNum = result[0].maxNum || 0;
    req.data.request_number = maxNum + 1;
  });

});
