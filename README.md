# Fulfillment Purchase Order Automation
**Type:** User Event\
**Developer(s):** Simon Balthazor\
**Initial Deployment Date:** 08/03/23
<br><br>
### Description
When an Item Fulfillment (IF) is created with a Status of 'Shipped' or is changed from 'Packed' to 'Shipped', a Purchase Order (PO) will automatically be generated from this script. This Purchase Order will have a line on the Item sublist (Item depends on shipmethod and item IDs are listed in the code), a value in the Rate & Amount fields (pulled from IF shippingcost), and a Description consisting of the IF's createdfrom Sales Order, Customer name, and packages data (weight, dims, tracking). The PO's Document Number will have a prefix that matches the IF's shipmethod. [UPS PO Example](https://5233917.app.netsuite.com/app/accounting/transactions/purchord.nl?id=695074)
<br><br>
### Custom Components
**Type:** Transaction Body Field (Sale)\
**Subtype:** List/Record (Transaction)\
**Name:** [Related UPS Bill](https://5233917.app.netsuite.com/app/common/custom/bodycustfield.nl?id=4795)\
**Description:** When a UPS, FedEx, or Freight fulfillment is set to shipped, the automatically generated PO will be linked in this field.
<br><br>
**Type:** SuiteScript\
**Subtype:** User Event Script\
**Name:** [Fulfillment PO Automation UE](https://5233917.app.netsuite.com/app/common/scripting/script.nl?id=1439)\
**Description:** Primary SuiteScript as detailed above.
<br><br>
### Script Details
[fulfillment_po_automation_ue.js](fulfillment_po_automation_ue.js)\
**Type:** User Event Script (API v2.0)\
**Deployment Status:** Released\
**Deployment Application:** Employee\
**Deployment Type:** Edit
