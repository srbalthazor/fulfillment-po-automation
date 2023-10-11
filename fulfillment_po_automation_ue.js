/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'], function(record,search) {

    function afterSubmit(context) {

        // Get pre submit and post submit objects
        var recObj = context.newRecord;
        var oldObj = context.oldRecord;

        // Get basic info for log: Document Number and Customer
        var docNum = recObj.getText({ fieldId: 'tranid' });
        log.debug('docNum', docNum);
        var customerName = recObj.getText({ fieldId: 'entity' });
        log.debug('customerName', customerName);

        // Confirming status is being changed to Shipped
        if (context.type === context.UserEventType.CREATE) {
            var oldStatus = 'B'; // Set old status to Packed if create and not edit
            log.debug("oldStatus",oldStatus);
        } else {
            var oldStatus = oldObj.getValue({ fieldId: 'shipstatus' });
            log.debug("oldStatus",oldStatus);
        }
        var newStatus = recObj.getValue({ fieldId: 'shipstatus' });
        log.debug("newStatus",newStatus);
        // Confirm old status is Packed and new is Shipped
        if (oldStatus === 'B' && newStatus === 'C') {
            log.debug('status is being changed to Shipped','EXECUTING');
        } else {
            log.debug('status is not being changed to Shipped','RETURNING');
            return;
        }

        // Verifying shipping method
        var shipMethod = recObj.getText({ fieldId: 'shipmethod' });
        log.debug("shipMethod",shipMethod);
        // Load ship method specific packages sublist
        if (shipMethod.indexOf('UPS') > -1) {
            log.debug('shipMethod is UPS','EXECUTING');
            var sublistName = 'packageups';
            var trackingName = 'packagetrackingnumberups';
            var weightName = 'packageweightups';
            var lengthName = 'packagelengthups';
            var widthName = 'packagewidthups';
            var heightName = 'packageheightups';
        } else if (shipMethod.indexOf('FedEx') > -1) {
            log.debug('shipMethod is FedEx','EXECUTING');
            var sublistName = 'packagefedex';
            var trackingName = 'packagetrackingnumberfedex';
            var weightName = 'packageweightfedex';
            var lengthName = 'packagelengthfedex';
            var widthName = 'packagewidthfedex';
            var heightName = 'packageheightfedex';
        } else if (shipMethod.indexOf('Freight') > -1) {
            log.debug('shipMethod is Freight','EXECUTING');
        } else {
            log.debug('shipMethod is not UPS, Freight, or FedEx','RETURNING');
            return;
        }
        var shipCost = recObj.getValue({ fieldId: 'shippingcost' });
        log.debug('shipCost', shipCost);
        

        // Getting tracking numbers from packages if UPS or FedEx
        var trackingNumList = '';
        if (shipMethod.indexOf('UPS') > -1 || shipMethod.indexOf('FedEx') > -1) {
            var packageCount = recObj.getLineCount({ sublistId: sublistName });
            log.debug("packageCount",packageCount);
            for (var i=0; i < packageCount; i++) {
                log.debug("Checking Package:",i);

                var trackingNum = recObj.getSublistValue({ 
                    sublistId: sublistName, 
                    fieldId: trackingName,
                    line: i
                });
                log.debug("trackingNum",trackingNum);
                var weight = recObj.getSublistValue({ 
                    sublistId: sublistName, 
                    fieldId: weightName,
                    line: i
                });
                log.debug("weight",weight);
                var length = recObj.getSublistValue({ 
                    sublistId: sublistName, 
                    fieldId: lengthName,
                    line: i
                });
                log.debug("length",length);
                var width = recObj.getSublistValue({ 
                    sublistId: sublistName, 
                    fieldId: widthName,
                    line: i
                });
                log.debug("width",width);
                var height = recObj.getSublistValue({ 
                    sublistId: sublistName, 
                    fieldId: heightName,
                    line: i
                });
                log.debug("height",height);

                //Combine values above into var to be used as description on new PO
                var trackingNumList = trackingNumList + '\n' + weight + ' lb ' + length + 'x' + width + 'x' + height + ' (' + trackingNum + ')';
            }
            log.debug("trackingNumList",trackingNumList);
        }

        // Get createdfrom and necessary fields from the SO
        var createdFrom = recObj.getValue({ fieldId: 'createdfrom' });
        var createdFromRec = record.load({
            type: record.Type.SALES_ORDER, 
            id: createdFrom,
            isDynamic: true,
        });
        var salesOrderNum = createdFromRec.getText({ fieldId: 'tranid'});
        log.debug('salesOrderNum', salesOrderNum);
        var salesOrderLocation = createdFromRec.getValue({ fieldId: 'location' });
        log.debug('salesOrderLocation', salesOrderLocation);

        // Combine the SO#, Customer Name, and list of tracking numbers to send to the PO
        var itemDescription = salesOrderNum + '\n' + customerName + trackingNumList;
        log.debug('itemDescription', itemDescription);    

        // Now create the new PO
        var newPO = record.create({
            type: record.Type.PURCHASE_ORDER,
            isDynamic: true
          });
    
        // Set body fields
        if (shipMethod.indexOf('UPS') > -1) {
            newPO.setValue({ fieldId: 'entity', value: '543' });
        } else if (shipMethod.indexOf('FedEx') > -1) {
            newPO.setValue({ fieldId: 'entity', value: '46510' });
        } else if (shipMethod.indexOf('Freight') > -1) {
            newPO.setValue({ fieldId: 'entity', value: '357' });
        }
        newPO.setValue({ fieldId: 'subsidiary', value: '2' });
        newPO.setValue({ fieldId: 'location', value: salesOrderLocation });
        newPO.setValue({ fieldId: 'memo', value: salesOrderNum });
        newPO.setValue({ fieldId: 'approvalstatus', value: '2' });

        // Set line item fields
        newPO.selectNewLine({
            sublistId: 'item'
        });
        if (shipMethod.indexOf('UPS') > -1) {
            newPO.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: '2847'
            });
        } else if (shipMethod.indexOf('FedEx') > -1) {
            newPO.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: '2858'
            });
        } else if (shipMethod.indexOf('Freight') > -1) {
            newPO.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: '2857'
            });
        }
        newPO.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: itemDescription
        });
        newPO.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: shipCost
        });
        newPO.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: shipCost
        });
        newPO.commitLine({
            sublistId: 'item'
        });
        // Save new PO
        var newPOID = newPO.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
        });
        log.debug('New PO:',newPOID);


        // Now reload PO to adjust the tranid based off the PO# already generated
        var reloadPO = record.load({
            type: record.Type.PURCHASE_ORDER,
            id: newPOID
        });
        var oldDocNum = reloadPO.getValue({ fieldId: 'tranid' });
        log.debug('oldDocNum',oldDocNum);
        if (shipMethod.indexOf('UPS') > -1) {
            var newDocNum = "UPS" + oldDocNum.substr(2);
        } else if (shipMethod.indexOf('FedEx') > -1) {
            var newDocNum = "FEDEX" + oldDocNum.substr(2);
        } else if (shipMethod.indexOf('Freight') > -1) {
            var newDocNum = "FREIGHT" + oldDocNum.substr(2);
        }
        log.debug('newDocNum',newDocNum);
        reloadPO.setValue({
            fieldId: 'tranid',
            value: newDocNum 
        });
        reloadPO.save({
            ignoreMandatoryFields: true 
        });
        
        createdFromRec.setValue({ 
            fieldId: 'custbody_related_ups_bill',
            value: newPOID
        });

        createdFromRec.save({
            ignoreMandatoryFields: true,
            enableSourcing: false
        });
    }
  
    return {
        afterSubmit: afterSubmit
    };
  
  });
  