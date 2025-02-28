/*
 * Created by Justin on 11/17/14.
 * This program is taking an out file from ClinVar and presenting it in a user-interface designed to make it easy to navigate.
 *
 * Major variables:
 *
 * vArray - The array where all of the variant objects are stored.
 * lArray - The original file split into lines.
 * Variant object - The object that contains the following:
 *      .name - The array of the names of the variants.
 *      .transcript - The array of the transcripts in the name.
 *      .labInterps - The array of entries submitted by the labs.
 */

function processDiffFile (location) {

    sigArray = readJSONArray('input/sigArray.json');
    vArray = readJSONArray('input/vArray.json');
    interpPairsArray = readJSONArray('input/interpPairsArray.json');
    labArray = readJSONArray('input/labArray.json');

    interpPairsArray = interpPairsArray.sort();

    labArray = Object.getOwnPropertyNames(countLabs());
    labArray = labArray.sort();

    $('#TheStatisticsTable tr td').click(function () {
        var td = $(this).closest('td');
        var tr = $(this).closest('tr');


        generateSigVariantTables(td[0].cellIndex - 2, tr[0].rowIndex - 1);
    });


    document.getElementById("LabMegaTableButton").onclick = function () {
        clearAreas();
        generateLabCountTable(countLabs(), labArray);
        ga('send', 'pageview', '/LabMegaTable');
    };
    window.onload = function () {
        clearAreas();
        generateHome();
        ga('send', 'pageview', '/');
    };
    document.getElementById("HomeButton").onclick = function () {
        clearAreas();
        generateHome();
        ga('send', 'pageview', '/');
    };
    document.getElementById("AboutButton").onclick = function () {
        clearAreas();
        generateAbout();
        ga('send', 'pageview', '/About');
    };
    document.getElementById("LabSearchButton").onclick = function () {
        clearAreas();
        generateLabSearchButtons();
        ga('send', 'pageview', '/LabSearch');
    };
    document.getElementById("SignificanceSearchButton").onclick = function () {
        clearAreas();
        $("#Area1").html(
            "<div class=\"container-fluid \"><div class=\"row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">Search By Significance</h4>A Clinical Significance Breakdown Table of all discrepancies in ClinVar <hr /></div> </div><div class=\"row \"><div class=\"col-sm-12 \">" +
            generateSigCountTable(countSigs(), sigArray, "N/A", 1, interpPairsArray, "N/A") +
            "</td></tr></div></div></div>");
        ga('send', 'pageview', '/SignificanceTable');
    };
    document.getElementById("VariantSearchButton").onclick = function () {
        clearAreas();
        generateSelectionBox(interpPairsArray);
        ga('send', 'pageview', '/VariantSearch');

    };
    // This function creates the selection box that contains all of the variant names.

    addHighlighter();

    var stopper = 0;

}

function selectLab(lab) {
    clearAreas();
    var labVArray = generateLabLArray(interpPairsArray, lab);
    var sigCounts = countSigs();
    sigArray = Object.getOwnPropertyNames(sigCounts);
    var tableGenerater = "";
    tableGenerater = tableGenerater + generateSigCountTable(sigCounts, sigArray, "0 ", 0, labVArray, lab);
    for (var i = 0; i < labArray.length; i++) {
        if(labArray[i] !== lab) {
            var labVArray2 = generateLabLArray(labVArray, labArray[i]);
            var stArray = generateSigTableArray(sigArray, lab, 0, labVArray2);
            var sigTable = generateSigCountTable(sigCounts, sigArray, labArray[i], 0, labVArray2, lab);
            if (totalCount(stArray) > 0) {
                tableGenerater = tableGenerater + "<tr><td>" + lab + "</td><td>" + labArray[i] + sigTable + "</td></tr>";
            }
        }
    }
    $("#Area1").html("<div class=\" container \"><h2>Laboratory: " + lab + "<h2></div>");
    $("#Area2").html("<div class=\" container \"><h4>Lab by Lab Summary </h4></div>");
    $("#Area3").html("<div class=\" container \">" + generateConflictOrConfidenceTable(lab) + "</div>");
    $("#Area4").html("<div class=\" container \"><h4>Significance Break Downs</h4><Table id=\"TheLabSpecificTable\" class=\" table table-condensed  table-striped \" ><tr><td> </td><td> All Other Labs: </td></tr><tr><td>" + lab + "</td><td>" + tableGenerater + "</td></tr></table></div>");
}

function readJSONArray(url) {
    var obj = new Array(0);
    $.ajax({
        type: "GET",
        url: url,
        async: false,
        dataType: "text",
        success: function(response){
            obj = jQuery.parseJSON(response);
        },
        error: function(err) {
            console.log("Error loading:" + url);
        }
    });
    return obj;

}

function clearAreas(){
    $("#Home").html("");
    $("#Area1").html("");
    $("#Area2").html("");
    $("#Area3").html("");
    $("#Area4").html("");
    $("#Area5").html("");
    $("#labVariants").html("");

}

function generateConflictOrConfidenceTable(lab) {
    var cdtArray = generateConflictDiscrepencyArray(lab);
    var totalConflict = 0;
    var totalConfidence = 0;
    for ( var i = 0; i < cdtArray.length; i++ ) {
        if( cdtArray[i].conflict === 1 ){
            totalConflict = totalConflict + 1;
        } else {
            totalConfidence = totalConfidence + 1;
        }
    }
    var tableGenerater = "<Table id=\"TheConfidenceTable\" class=\" table table-condensed  table-striped table-bordered \" >";
    tableGenerater = tableGenerater + "<tr><td><b>" + "Lab Name" + "</b></td><td><b>" + "Conflict" + "</b></td><td><b>"  + "Confidence Discrepancy" + "</b></td><td><b>" + " Total " + "</b></td></tr>";
    for ( var j = 0; j < cdtArray.length; j++ ) {
        if(cdtArray[j].total !== 0) {
            tableGenerater = tableGenerater + "<tr><td>" + cdtArray[j].name + "</td><td>" + cdtArray[j].conflict + "</td><td>" + cdtArray[j].discrepency + "</td><td>" + cdtArray[j].total + "</td></tr>";
        }
    }

    tableGenerater = tableGenerater + "</table>";

    return tableGenerater;
}

function generateConflictDiscrepencyArray(lab){
    var labNameArray = createUniqueLabsArray();
    var cdtArray = changeLabArrayToObjects(labNameArray);
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        for (var j = 0; j < 2; j++) {
            if (lab === interpPairsArray[i].labInterps[j].source) {
                if (j === 0) {
                    incrementCArray(interpPairsArray[i].labInterps[1].source, cdtArray, interpPairsArray[i]);
                } else {
                    incrementCArray(interpPairsArray[i].labInterps[0].source, cdtArray, interpPairsArray[i]);
                }
            }
        }
    }
    return cdtArray;
}

function incrementCArray(lab, cdtArray, variant) {
    for ( var i = 0; i < cdtArray.length; i++ ) {
        if ( cdtArray[i].name === lab ) {
            cdtArray[i].conflict = cdtArray[i].conflict + variant.conflict;
            cdtArray[i].discrepency = cdtArray[i].discrepency + variant.discrepency;
            cdtArray[i].total = cdtArray[i].conflict + cdtArray[i].discrepency;
        }
    }

}

function changeLabArrayToObjects(labArray) {
    for ( var i = 0; i < labArray.length; i++ ) {
        var object = new Object();
        object.name = labArray[i];
        object.conflict = 0;
        object.discrepency = 0;
        object.total = 0;
        labArray[i] = object;
    }

    return(labArray);
}

function generateLabLArray(array, lab) {
    var labLVArray = new Array();
    for ( var i = 0; i < array.length; i++ ) {
        var iArray = array[i].labInterps;
        if (iArray[0].source === lab ||iArray[1].source === lab) {
            labLVArray.push(array[i]);
        }
    }
    return labLVArray;

}

function generateLabLVariantArray(lab) {
    var labLVArray = new Array();
    for (var i = 0; i < interpPairsArray.length; i++) {
        var iArray = interpPairsArray[i].labInterps;
        if(iArray[0].source === lab || iArray[1].source === lab) {
            labLVArray.push(interpPairsArray[i]);
        }
    }
    return labLVArray;
}

function generateAbout() {
    clearAreas();
    var htmlOutput = "";
    htmlOutput = "<div class=\"container\"><div class=\"row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">About</h4>About Text here</div></div>"
    $("#Area1").html(htmlOutput);
}

function generateHome() {
    clearAreas();
    var htmlOutput = "";
    htmlOutput = "<div class=\"container\"><h1 align = \"center\">Welcome to VariantExplorer!</h1>  <p>The goal of VariantExplorer is to facilitate identification of clinical significance interpretation discrepancies in ClinVar (<a href=\"http://www.ncbi.nlm.nih.gov/clinvar/\" target=\"_blank\">http://www.ncbi.nlm.nih.gov/clinvar/</a>), a submitter-driven repository that archives reports of the relationships among genomic variants and phenotypes submitted by clinical laboratories, researchers, clinicians, expert panels, practice guidelines, and other groups or organizations. Given the large number of submitters to ClinVar, many variants have interpretations from multiple submitters and those interpretations may not always agree. </p><p>By displaying how the full set of variant interpretations from a specific submitter compares to all other submitters (or to another specific submitter), VariantExplorer helps users view the types and levels of discrepancies in ClinVar. The submitter-specific Clinical Significance Breakdown Tables (seen below) displays pair-wise counts of discrepant interpretations, including confidence discrepancies (such as Benign vs Likely benign or Pathogenic vs Likely pathogenic). For example, the table below indicates there are 12 variants in ClinVar interpreted as Likely benign by Submitter A and interpreted as Uncertain significance by Submitter B. By displaying the discrepancies in this manner, VariantExplorer hopes to facilitate resolution of interpretation discrepancies.</p><div class=\"text-center\"> <h3 class=\"text-center margin-bottom-none\">Clinical Significance Breakdown Table example</h3><img src=\"img/chart.jpg\" class=\"img-responsive \" alt=\"Clinical Significance Breakdown Table example\" /></div><p><br /><strong>The discrepancy data in VariantExplorer can be viewed from four different approaches:</strong></p><ul class=\"list-group\"><li class=\"list-group-item\"><h4 class=\"margin-none\">Search By Submitter</h4>This option allows users to view all discrepancies with regard to a specific ClinVar submitter. Selecting a ClinVar submitter navigates to a Submitter by Submitter Summary table of all submitters with interpretations that are discrepant with the submitter of interest. The discrepancy counts are broken into Confidence Discrepancy and Conflict. Below the summary table are the Clinical Significance Breakdown Tables of each submitter-submitter pair listed in the Submitter by Submitter Summary table. Clicking the counts in any Clinical Significance Breakdown Table displays the variants with clinical significance discrepancies and summary information about each submission, such as asserted condition and date last evaluated. Selecting the variant name will direct a user to the variant page in ClinVar.  </li> <li class=\"list-group-item\"><h4 class=\"margin-none\">Show Submitter Mega Table</h4>This option allows users to view discrepancy counts between all submitters in ClinVar. Each submitter is assigned a lab number and hovering over a lab number or discrepancy count displays the full name of that ClinVar submitter. Clicking the discrepancy counts in any cell will display those variants of interest below the table. </li><li class=\"list-group-item\"><h4 class=\"margin-none\">Search By Significance</h4>A Clinical Significance Breakdown Table of all discrepancies in ClinVar</li><li class=\"list-group-item\"><h4 class=\"margin-none\">Search By Variant</h4>A dropdown list of all variants in ClinVar with clinical significance discrepancies</li></ul></div>"
    $("#Home").html(htmlOutput);
}

function generateLabSearchButtons() {
    clearAreas();
    var htmlOutput = "";
    var uniqueLabArray = createUniqueLabsArray(vArray);

    for( var i = 0; i < uniqueLabArray.length; i++ ) {
        htmlOutput = htmlOutput + "<div class=\"col-md-6 padding-thin \"><button class=\"btn btn-primary btn-block btn-text \" button type=\"button\" id=\"";
        htmlOutput = htmlOutput + uniqueLabArray[i] + "\" onclick=\"selectLab('" + uniqueLabArray[i] + "')\">" + uniqueLabArray[i];
        htmlOutput = htmlOutput + "</button></div>"
    }
    htmlOutput = "<div class=\"container\"><div class=\"row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">Search By Submitter</h4>This option allows users to view all discrepancies with regard to a specific ClinVar submitter. Selecting a ClinVar submitter navigates to a Submitter by Submitter Summary table of all submitters with interpretations that are discrepant with the submitter of interest. The discrepancy counts are broken into Confidence Discrepancy and Conflict. Below the summary table are the Clinical Significance Breakdown Tables of each submitter-submitter pair listed in the Submitter by Submitter Summary table. Clicking the counts in any Clinical Significance Breakdown Table displays the variants with clinical significance discrepancies and summary information about each submission, such as asserted condition and date last evaluated. Selecting the variant name will direct a user to the variant page in ClinVar. <hr /></div> </div><div class=\"row \">" + htmlOutput + "</div></div>"
    $("#Area1").html(htmlOutput);
}

function generateSigTableForLabPair(lab1, lab2) {
    var labCount = countLabs();
    var sigCount = countSigs();
    var sigArray = Object.getOwnPropertyNames(sigCount);
    var stArray = generateSigTableArrayForLabPair(sigArray, labArray, lab1, lab2);
    var tableGenerater = "<Table id=\"TheStatisticsTable\"  class=\"table table-condensed table-bordered \" >";
    tableGenerater = tableGenerater + sigTableHeader(sigArray);

    for (var i = 0; i < sigArray.length; i++) {
        tableGenerater = tableGenerater + writeSigTableRow(sigArray[i], sigCount[sigArray[i]], i, stArray);

    }
    tableGenerater = tableGenerater + "</Table>";

    $("#variantSigStatistics").html(tableGenerater);
}

function generateSigCountTable (sigCounts, sigArray, secondaryLab, labSpecificFlag, array, primaryLab) {
    clearAreas();
    var stArray = generateSigTableArray(sigArray, primaryLab, labSpecificFlag, array);
    var tableGenerater = "";
    var labNoSpace = primaryLab.replace(/[';\s&,\/()]+/g, "");
    var secondLabNoSpace = secondaryLab.replace(/[';\s&,\/()]+/g, "");
    tableGenerater = "<Table id=\"The" + labNoSpace + secondLabNoSpace + "SigTable\" class=\" table table-condensed  table-striped table-bordered \" >";
    tableGenerater = tableGenerater + sigTableHeader(sigArray);

    for (var i = 0; i < sigArray.length; i++) {
        tableGenerater = tableGenerater + writeSigTableRow(sigArray[i], sigCounts[sigArray[i]], i, stArray);

    }

    tableGenerater = tableGenerater + "<tr><td></td><td id = \"" + labNoSpace + secondLabNoSpace + "\" colspan=\"6\"></td></tr>";
    tableGenerater = tableGenerater + "</Table>";
    tableGenerater = tableGenerater +  "<script>" +
    "$('#The" + labNoSpace + secondLabNoSpace + "SigTable tr td').click(function() {" +
    "var td = $(this).closest('td');" +
    "var tr = $(this).closest('tr');";
    tableGenerater = tableGenerater + "generateSigVariantListForLabPair(tr[0].rowIndex -1, td[0].cellIndex - 2, \"" + primaryLab + "\", \"" + secondaryLab + "\");});";
    tableGenerater = tableGenerater + "</script>";

    return tableGenerater;
}

function generateSigVariantListForLabPair(index1, index2, lab, secondaryLab) {
    if (index1 < 5 ) {
        var sigArray = Object.getOwnPropertyNames(countSigs());
        var sigVArray = generateSigVArrayForLabPair(sigArray, index1, index2, lab, secondaryLab);
        var labNoSpace = lab.replace(/[';\s&,\/()]+/g, "");
        var secondLabNoSpace = secondaryLab.replace(/[';\s&,\/()]+/g, "");
        var htmlOutput = "";
        for (var i = 0; i < sigVArray.length; i++) {
            htmlOutput = htmlOutput + buildVariantTable(sigVArray[i]);
        }
        $("#" + labNoSpace + secondLabNoSpace).html(htmlOutput);
    }
}

function totalCount(stArray) {
    var count = 0;
    for ( var i = 0; i < stArray.length; i++ ) {
        for ( var j = 0; j < stArray[i].length; j++ ) {
            count = count + stArray[i][j];
        }
    }

    return count;
}

function generateLabCountTable (labCounts, labArray) {
    clearAreas();
    var ltArray = generateLabTable(labArray);
    var tableGenerater = "<div class=\"container-fluid row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">Show Submitter Mega Table</h4>This option allows users to view discrepancy counts between all submitters in ClinVar. Each submitter is assigned a lab number and hovering over a lab number or discrepancy count displays the full name of that ClinVar submitter. Clicking the discrepancy counts in any cell will display those variants of interest below the table. <hr /></div> </div><div class=\"table-responsive container-fluid \"><table id = \"TheLabMegaTable\" class=\" table table-condensed  table-striped table-bordered \" >";
    tableGenerater = tableGenerater + labTableHeader(labArray);

    for ( var i = 0; i < labArray.length; i++ ) {
        tableGenerater = tableGenerater + writeLabTableRow(labArray[i], labCounts[labArray[i]], i, ltArray);

    }
    tableGenerater = tableGenerater + "</table></div>";

    $("#Area1").html(tableGenerater);

    $('#TheLabMegaTable tr td').click(function () {
        var td = $(this).closest('td');
        var tr = $(this).closest('tr');


        generateLabVariantTables(td[0].cellIndex - 3, tr[0].rowIndex - 1);
    });
    addHighlighter();
}

function generateSigTableArray(sigArray, primaryLab, labSpecificFlag, array) {
    var stArray = initializeSTArray(sigArray.length);
    for ( var i = 0; i < array.length; i++ ) {
        var iArray = array[i].labInterps;
        var sig1 = iArray[0].significance;
        var sig2 = iArray[1].significance;
        if ( iArray[0].source !== primaryLab ) {
            var index2 = sigArray.indexOf(sig1);
            var index1 = sigArray.indexOf(sig2);
        } else {
            var index2 = sigArray.indexOf(sig2);
            var index1 = sigArray.indexOf(sig1);
        }
        stArray[index1] [index2] = stArray[index1] [index2] + 1;
        if ( labSpecificFlag === 1 ) {
            stArray[index2] [index1] = stArray[index2] [index1] + 1;
        }
    }
    return stArray;
}

function generateConflictDiscrepenciesTableArray(labSpecificFlag) {
    var cdtArray = initializeCDTArray();
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        var iArray = interpPairsArray[i].labInterps;
        var sig1 = iArray[0].significance;
        var sig2 = iArray[1].significance;
        if ( iArray[0].source !== primaryLab ) {
            var index2 = sigArray.indexOf(sig1);
            var index1 = sigArray.indexOf(sig2);
        } else {
            var index2 = sigArray.indexOf(sig2);
            var index1 = sigArray.indexOf(sig1);
        }
        cdtArray[index1] [index2] = cdtArray[index1] [index2] + 1;
        if ( labSpecificFlag === 1 ) {
            cdtArray[index2] [index1] = cdtArray[index2] [index1] + 1;
        }
    }
    return cdtArray;
}

function initializeSTArray(pLength) {
    var stArray = new Array();
    for ( var i = 0; i < pLength; i++ ) {
        stArray[i] = new Array();
        for ( var j = 0; j < pLength; j++ ) {
            stArray[i][j]=0;
        }
    }

    return stArray;

}

function initializeCDTArray() {
    var cdtArray = new Array();
    for ( var i = 0; i < 2; i++ ) {
        cdtArray[i] = new Array();
        for ( var j = 0; j < 2; j++ ) {
            cdtArray[i][j] = new Array();
            for ( var k = 0; k < 2; k++ ) {
                cdtArray[i][j][k] = 0;
            }
        }
    }

    return cdtArray;

}

function generateSigTableArrayForLabPair(sigArray, labArray, lab1, lab2) {
    var stArray = createSigTableArray(sigArray);
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        var iArray = interpPairsArray[i].labInterps;
        for ( var j = 0; j < iArray.length; j++ ) {
            var name1 = iArray[j].significance;
            var sName1 = iArray[j].source;
            var jIndex = sigArray.indexOf(name1);
            for ( var k = j + 1; k < iArray.length; k++ ) {
                var name2 = iArray[k].significance;
                var sName2 = iArray[k].source;
                var kIndex = sigArray.indexOf(name2);
                if (name1 != name2 && (
                    (sName1 === labArray[lab1] && sName2 === labArray[lab2]) || (sName1 === labArray[lab2] && sName2 === labArray[lab1])
                    )) {
                    stArray[jIndex] [kIndex] = stArray[jIndex] [kIndex] + 1;
                    stArray[kIndex] [jIndex] = stArray[kIndex] [jIndex] + 1;
                }
            }
        }
    }
    return stArray;
}

function generateSigVariantTables(index1, index2) {
    var sigArray = Object.getOwnPropertyNames(countSigs());
    var sigVArray = generateSigVArray(sigArray, index1, index2);
    var htmlOutput = "";
    for ( var i = 0; i < sigVArray.length; i++ ) {
        htmlOutput = htmlOutput + buildVariantTable(sigVArray[i]);
    }

    $("#sigVariants").html(htmlOutput);
}

function generateLabVariantTables(index1, index2) {
    var LabVArray = generateLabVArray(labArray, index1, index2);
    var htmlOutput = "";
    htmlOutput = htmlOutput + "<div id=\"variantSection\" >";
    for ( var i = 0; i < LabVArray.length; i++ ) {
        htmlOutput = htmlOutput + buildVariantTable(LabVArray[i]);
    }
    htmlOutput = htmlOutput + "</div>";
    $("#labVariants").html(htmlOutput);
}

function generateSigVArray(sigArray, index1, index2) {
    var sigVArray = new Array();
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        var iArray = interpPairsArray[i].labInterps;
        for ( var j = 0; j < iArray.length; j++ ) {
            var name1 = iArray[j].significance;
            var jIndex = sigArray.indexOf(name1);
            if(jIndex === index1 || jIndex === index2) {
                for ( var k = j + 1; k < iArray.length; k++ ) {
                    var name2 = iArray[k].significance;
                    var kIndex = sigArray.indexOf(name2);
                    if (kIndex === index2 || kIndex === index1) {
                        if (name1 != name2) {
                            sigVArray.push(interpPairsArray[i]);
                        }
                    }
                }
            }
        }
    }
    return sigVArray;
}

function generateSigVArrayForLabPair(sigArray, index1, index2, lab, secondaryLab) {
    var sigVArray = new Array();
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        var iArray = interpPairsArray[i].labInterps;
        var sig0 = iArray[0].significance;
        var sig1 = iArray[1].significance;
        var name0 = iArray[0].source;
        var name1 = iArray[1].source;

        if ((name0 === lab || lab === "N/A") && sig0 === sigArray[index1] || (name0 === secondaryLab || secondaryLab === "0 " || secondaryLab === "N/A") && sig0 === sigArray[index2]) {
            if ((name1 === lab || lab === "N/A") && sig1 === sigArray[index1] || (name1 === secondaryLab || secondaryLab === "0 " || secondaryLab === "N/A") && sig1 === sigArray[index2]) {
                sigVArray.push(interpPairsArray[i]);
            }
        }
    }
    return sigVArray;
}

function generateLabVArray(labArray, index1, index2) {
    var LabVArray = new Array();
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        var iArray = interpPairsArray[i].labInterps;
        for ( var j = 0; j < iArray.length; j++ ) {
            var name1 = iArray[j].source;
            var jIndex = labArray.indexOf(name1);
            if(jIndex === index1 || jIndex === index2) {
                for ( var k = j + 1; k < iArray.length; k++ ) {
                    var name2 = iArray[k].source;
                    var kIndex = labArray.indexOf(name2);
                    if (kIndex === index2 || kIndex === index1) {
                        if (name1 != name2) {
                            LabVArray.push(interpPairsArray[i]);
                        }
                    }
                }
            }
        }
    }
    return LabVArray;
}

function generateLabTable(labArray) {
    var ltArray = createLabTableArray(labArray);
    var name;
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        var iArray = interpPairsArray[i].labInterps;
        for ( var j = 0; j < iArray.length; j++ ) {
            name = iArray[j].source;
            var jIndex = labArray.indexOf(name);
            for ( var k = j + 1; k < iArray.length; k++ ) {
                name = iArray[k].source;
                var kIndex = labArray.indexOf(name);
                ltArray[jIndex] [kIndex] = ltArray[jIndex] [kIndex] + 1;
                ltArray[kIndex] [jIndex] = ltArray[kIndex] [jIndex] + 1;
            }
        }
    }
    return ltArray;
}

function addHighlighter() {
    var allCells = $('td, th');
    allCells.on('mouseover', function () {
        var el = $(this), pos = el.index();
        el.parent().find('th, td').addClass('hover');
        allCells.filter(':nth-child(' + (pos + 1) + ')').addClass('hover');
    }).on('mouseout', function () {
        allCells.removeClass('hover');
    });
}

function sigTableHeader(sigArray) {
    var headerGenerater = "<thead><tr><th>Significance Name</th><th>Significance Variant Count</th>";
    for( i = 0; i < sigArray.length; i++ ) {
        headerGenerater = headerGenerater + "<th>" + sigArray[i] + "</th>";
    }
    headerGenerater = headerGenerater + "</tr></thead>";
    return headerGenerater;

}

function labTableHeader(labArray) {
    var headerGenerater = "<thead><tr><th>Lab Name</th><th>Lab #</th><th>Lab Variant Count</th>";
    for( i = 0; i < labArray.length; i++ ) {
        headerGenerater = headerGenerater + "<th><span data-toggle=\"tooltip\" data-placement=\"top\" title=\"" + labArray[i] + "\">Lab " + ( i + 1 ) + "</span></th>";
    }
    headerGenerater = headerGenerater + "</tr></thead>";
    return headerGenerater;

}

function createSigTableArray(sigArray) {
    var stArray = new Array();
    for ( var i = 0; i < sigArray.length; i++ ){
        stArray[i] = new Array();
        for ( var j = 0; j < sigArray.length; j++ ) {
            stArray[i][j] = 0;
        }
    }

    return stArray;
}

function createLabTableArray(labArray) {
    var ltArray = new Array();
    for ( var i = 0; i < labArray.length; i++ ){
        ltArray[i] = new Array();
        for ( var j = 0; j < labArray.length; j++ ) {
            ltArray[i][j] = 0;
        }
    }

    return ltArray;
}

function countSigs() {
    var sigCounters = new Object();

    sigCounters["Pathogenic"] = 0;
    sigCounters["Likely pathogenic"] = 0;
    sigCounters["Uncertain significance"] = 0;
    sigCounters["Likely benign"] = 0;
    sigCounters["Benign"] = 0;

    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        for ( var j = 0; j < interpPairsArray[i].labInterps.length; j++ ) {
            var sigClass = interpPairsArray[i].labInterps[j].significance;
            var propArray = Object.getOwnPropertyNames(sigCounters);

            if (propArray.indexOf(sigClass) === -1) {
                sigCounters[sigClass] = 0;
            }
            sigCounters[sigClass] = sigCounters[sigClass] + 1;
        }
    }

    return sigCounters;
}

function countLabs() {
    var labCounters = new Object();

    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        for ( var j = 0; j < interpPairsArray[i].labInterps.length; j++ ) {
            var labName = interpPairsArray[i].labInterps[j].source;
            var propArray = Object.getOwnPropertyNames(labCounters);

            if (propArray.indexOf(labName) === -1) {
                labCounters[labName] = 0;
            }
            labCounters[labName] = labCounters[labName] + 1;
        }
    }

    return labCounters;
}

function createUniqueLabsArray () {
    var uniqueLabs = new Array();
    for ( var i = 0; i < vArray.length; i++ ) {
        $.each(vArray[i].labInterps, function (i, el) {
            if ($.inArray(el.source, uniqueLabs) === -1) uniqueLabs.push(el.source);
        });
    }
    uniqueLabs.sort();
    return uniqueLabs;
}

function generateSelectionBox() {
    clearAreas();
    var htmlOut = "<div class=\" container \"><div class=\"row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">Search By Variant</h4>A dropdown list of all variants in ClinVar with clinical significance discrepancies<hr /></div> </div><div class=\"row \"><select class=\"form-control \" onChange=\"selectBoxChanged()\" id=\"varSelect\">";
    for ( var i = 0; i < interpPairsArray.length; i++) {
        htmlOut = htmlOut + "<option value=\"" + i + "\">" + interpPairsArray[i].name + "</option>";
    }
    htmlOut = htmlOut + "</select></div></div>";

    $("#Area1").html(htmlOut);
}

function selectBoxChanged() {
    var myselect = document.getElementById("varSelect");
    var selectIndex = myselect.options[myselect.selectedIndex].value;

    var htmlOutput = buildVariantTable(interpPairsArray[selectIndex]);
    $("#Area2").html("<div class=\" container \">" + htmlOutput + "</div>");

}

function buildVariantTable(variant) {
    var htmlOutput = "<Table class=\"table table-condensed table-bordered  table-striped \" >";
    htmlOutput = htmlOutput + "<tr>";
    htmlOutput = htmlOutput + "<h3><a href=\"http://www.ncbi.nlm.nih.gov/clinvar/?term=" + variant.name + "\" target=\"_blank\">" + variant.transcript + variant.name + " <i class=\"glyphicon glyphicon-new-window \"></i></a></h3>";
    htmlOutput = htmlOutput + "</tr>";

    htmlOutput = htmlOutput + "<tr>";
    htmlOutput = htmlOutput + buildLabInterpTable(variant);
    htmlOutput = htmlOutput + "</tr>";
    htmlOutput = htmlOutput + "</table>";

    return htmlOutput;
}

function buildLabInterpTable(variant) {
    var htmlOutput = "";

    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"source", 0);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"significance", 1);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"evalDate", 0);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"scv", 0);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"comments", 0);

    return htmlOutput;
}

function writeRow (labInterps, propName, sigFlag) {
    var htmlOutput = "<tr>";

    for ( var i = 0; i < labInterps.length; i++) {
        htmlOutput = htmlOutput + writeTD(labInterps);
        if(sigFlag === 1) {
            htmlOutput = htmlOutput + labInterps[i][propName] + " (" + labInterps[i].subCondition + ")";
        } else {
            htmlOutput = htmlOutput + labInterps[i][propName];
        }
        htmlOutput = htmlOutput + "</td>";
    }

    htmlOutput = htmlOutput + "</tr>";

    return htmlOutput;
}

function writeTD(labInterps) {
    return "<td width = \"100/" + labInterps.length + "\">";
}

function writeSigTableRow(sigName, sigCount, sigIndex, stArray) {
    var htmlOutput = "<tr><td>";
    htmlOutput = htmlOutput + sigName;
    htmlOutput = htmlOutput + "</td><td>";
    htmlOutput = htmlOutput + "Coming Soon";
    htmlOutput = htmlOutput + "</td>";
    for ( var i = 0; i < stArray[sigIndex].length; i++ ) {
        htmlOutput = htmlOutput + "<td>" + stArray[sigIndex][i] + "</td>";
    }
    htmlOutput = htmlOutput + "</tr>";

    return htmlOutput;
}



function writeLabTableRow(labName, labCount, labIndex, ltArray) {
    var htmlOutput = "<tr><td>";
    htmlOutput = htmlOutput + labName;
    htmlOutput = htmlOutput + "</td><td>";
    htmlOutput = htmlOutput + ( labIndex + 1 );
    htmlOutput = htmlOutput + "</td><td>";
    htmlOutput = htmlOutput + labCount;
    htmlOutput = htmlOutput + "</td>";
    for ( var i = 0; i < ltArray[labIndex].length; i++ ) {
        htmlOutput = htmlOutput + "<td><a href=\"#variantSection\" title=\"" + labArray[i] + " and " + labName + "\">" + ltArray[labIndex][i] + "</td>";
    }
    htmlOutput = htmlOutput + "</tr>";

    return htmlOutput;
}