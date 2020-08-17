var vscode;
var filterType = "";
var oldFilter = "";


function filterList() {
    var input, filter, table, tr, td, i, txtValue, onlyNumbers;
    // @ts-ignore
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    // @ts-ignore
    table = document.getElementById("objectTable");
    tr = table.getElementsByTagName("tr");
    console.log("Before");
    onlyNumbers = /^\d+$/.test(filter);

    //if (filter.startsWith(oldFilter))
    //tr = [...tr].filter(element => element.style.display != "none");
    var start = Date.now();
    for (i = 0; i < tr.length; i++) {
        if (i >= tr.length - 1){
            console.log(Date.now().toString() + " - " + start + " = " + filter);
        }
        if (filter.startsWith(oldFilter) && tr[i].style.display == "none")
            continue;

        // Type
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

function objectTableSelected(element) {
    var elements = element.getElementsByTagName("td");
    console.log(elements[6].innerHTML);
    vscode.postMessage("open " + elements[6].innerHTML);
}