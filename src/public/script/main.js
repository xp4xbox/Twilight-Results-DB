let inSearch;
let btnFilterByYear;

function createResultsCtn(results_count) {
    if (btnFilterByYear) {
        document.getElementById("btns").removeChild(btnFilterByYear);
        btnFilterByYear = null;
    }

    let ctnResulsTitle = document.getElementById("ctnResultsTitle");
    ctnResulsTitle.classList.add("resultsTitleContainer");
    ctnResulsTitle.innerHTML = `<h3>${results_count} Results:</h3>`

    let ctnResults = document.getElementById("ctnResults");
    ctnResults.classList.add("resultsContainer");
    ctnResults.innerHTML = "";
}

function getAthletes() {
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                let data = JSON.parse(xHttp.responseText);
                createResultsCtn(data.length)

                for (let i = 0; i < data.length; i++) {
                    let el = document.createElement("a");

                    el.setAttribute('href', '/athlete?name=' + data[i].full_name + '&birth_year=' + data[i].birth_year);
                    el.classList.add("hyperlink");
                    el.innerHTML = data[i].full_name;

                    document.getElementById("ctnResults").appendChild(el);
                }
            } else {
                alert("Server returned error: " + xHttp.status);
            }
        }
    }

    if (inSearch.value !== '') {
        xHttp.open("GET", "/api/athletes?name=" + inSearch.value);
    } else {
        xHttp.open("GET", "/api/athletes");
    }

    xHttp.send();
}

function getClubs() {
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                let data = JSON.parse(xHttp.responseText);
                createResultsCtn(data.length)

                for (let i = 0; i < data.length; i++) {
                    let el = document.createElement("a");

                    el.setAttribute('href', '/club/' + data[i].club_name);
                    el.classList.add("hyperlink");
                    el.innerHTML = data[i].club_name;

                    document.getElementById("ctnResults").appendChild(el);
                }
            } else {
                alert("Server returned error: " + xHttp.status);
            }
        }
    }

    if (inSearch.value !== '') {
        xHttp.open("GET", "/api/clubs?name=" + inSearch.value);
    } else {
        xHttp.open("GET", "/api/clubs");
    }

    xHttp.send();
}

function getEvents(subquery = null) {
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                let data = JSON.parse(xHttp.responseText);
                createResultsCtn(data.length)

                let ctn = document.getElementById("btns");
                btnFilterByYear = document.createElement("button");
                btnFilterByYear.innerHTML = "Filter Event by Year";
                btnFilterByYear.addEventListener("click", function () {getEvents("year")});
                ctn.appendChild(btnFilterByYear);

                for (let i = 0; i < data.length; i++) {
                    let el = document.createElement("a");

                    el.setAttribute('href', '/event?event_name=' + data[i].evt_name + '&date=' + data[i].date + "&meet=" + data[i].meet_name);
                    el.classList.add("hyperlink");
                    el.innerHTML = data[i].evt_name;

                    document.getElementById("ctnResults").appendChild(el);
                }
            } else if (xHttp.status === 440) {
                alert("Cookie expired, please refresh the page");
            } else {
                alert("Server returned error: " + xHttp.status);
            }
        }
    }

    if (subquery != null) {
        if (inSearch.value !== "") {
            xHttp.open("GET", `/api/events/subquery?${subquery}=${inSearch.value}`);
        } else {
            return;
        }
    } else {
        if (inSearch.value !== '') {
            xHttp.open("GET", "/api/events?name=" + inSearch.value);
        } else {
            xHttp.open("GET", "/api/events");
        }
    }


    xHttp.send();
}

window.onload = () => {
    const btnAthleteSearch = document.getElementById("btnAthleteSearch");
    btnAthleteSearch.addEventListener("click", getAthletes);

    const btnClubSearch = document.getElementById("btnClubSearch");
    btnClubSearch.addEventListener("click", getClubs);

    const btnEventSearch = document.getElementById("btnEventSearch");
    btnEventSearch.addEventListener("click", function() { getEvents() });

    inSearch = document.getElementById("inSearch");
}