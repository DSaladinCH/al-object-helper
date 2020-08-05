var vscode;
var filterType = "";
var oldFilter = "";

function myFunction() {
    var input, filter, table, tr, td, i = -1, txtValue, onlyNumbers;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("objectTable");
    tr = table.getElementsByTagName("tr");
    console.log("Before");
    onlyNumbers = /^\d+$/.test(filter);

    for (i = 0; i < tr.length; i++) {
        if (filter.startsWith(oldFilter) && tr[i].style.display == "none")
            continue;
        // Type
        console.log(filterType);
        if (filterType != "") {
            td = tr[i].getElementsByTagName("td")[0];
            if (td) {
                txtValue = td.textContent || td.innerText;
                if (txtValue.toUpperCase() == filterType.toUpperCase()) {
                    tr[i].style.display = "";
                }
                else {
                    tr[i].style.display = "none";
                    continue;
                }
            }
        }

        // ID
        if (onlyNumbers) {
            td = tr[i].getElementsByTagName("td")[1];
            if (td) {
                txtValue = td.textContent || td.innerText;
                if (txtValue.toUpperCase().startsWith(filter)) {
                    tr[i].style.display = "";
                    continue;
                }
                else {
                    tr[i].style.display = "none";
                }
            }
        }

        // Name
        td = tr[i].getElementsByTagName("td")[2];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
                continue;
            }
            else {
                tr[i].style.display = "none";
            }
        }

        // // Extends
        // td = tr[i].getElementsByTagName("td")[3];
        // if (td) {
        //     txtValue = td.textContent || td.innerText;
        //     if (txtValue.toUpperCase().indexOf(filter) > -1) {
        //         tr[i].style.display = "";
        //         continue;
        //     }
        //     else {
        //         tr[i].style.display = "none";
        //     }
        // }
    }

    oldFilter = filter;
}

async function test2(tr, filter) {
    var td, i = -1, txtValue, filter;
    for await (const trElement of tr) {
        i++;
        console.log(i);
        // Type
        console.log(filterType);
        if (filterType != "") {
            td = trElement.getElementsByTagName("td")[0];
            if (td) {
                txtValue = td.textContent || td.innerText;
                if (txtValue.toUpperCase() == filterType.toUpperCase()) {
                    tr[i].style.display = "";
                }
                else {
                    tr[i].style.display = "none";
                    continue;
                }
            }
        }

        // ID
        td = trElement.getElementsByTagName("td")[1];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().startsWith(filter)) {
                tr[i].style.display = "";
                continue;
            }
            else {
                tr[i].style.display = "none";
            }
        }

        // Name
        td = trElement.getElementsByTagName("td")[2];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
                continue;
            }
            else {
                tr[i].style.display = "none";
            }
        }

        // Extends
        td = trElement.getElementsByTagName("td")[3];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
                continue;
            }
            else {
                tr[i].style.display = "none";
            }
        }
    }
}

function objectTableSelected(element) {
    var elements = element.getElementsByTagName("td");
    console.log(elements[6].innerHTML);
    vscode.postMessage("open " + elements[6].innerHTML);
    // vscode.workspace.openTextDocument(elements[6].innerHTML).then(doc => {
    //     vscode.window.showTextDocument(doc);
    //     //this.showInformationMessage(longType + " " + id + " opened");
    // }, function (reason) {
    //     this.output("Rejected: " + reason);
    // });
}