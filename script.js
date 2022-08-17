indexBody = document.getElementsByTagName("body")[0];


function loadNavBar(){
    document.getElementById("navbar").innerHTML = `
    <!-- insert logo here -->
    <a href="index.html" ><img src="images/logo.png" alt="logo" class="logo"></a>

    <ul>
        <li><a class="navButton1" href="index.html">Main Page</a></li>
        <li><a class="navButton2" href="about.html">About Me</a></li>
        <li><a class="navButton3" href="portfolio.html">My Projects</a></li>
        <li><a class="navButton4" href="contact.html">C.V.</a></li>
        <li><a class="navButton5" href="contact.html">Contact Me</a></li>
        <li><a class="navButton6" href="contact.html">I Have a Blog Too!</a></li>
    </ul>
    `
}


// open Main Page.html on loading window
indexBody.onload = function() {
    loadNavBar();
    landingBody = document.getElementById("landing-page");
    landingPageContent = document.getElementById('')
}
