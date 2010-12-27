Gobi Platform SDK
=================

Installation
------------
### Prerequisites
*	None

### Clone repository
*	Open a command prompt
*	change to the base directory where you want to download source code, eg

		cd \projects
*	Execute the following commands (clone shown with SSH URL. Substitute with HTTP or Git Read-Only URL as applicable)
		
		mkdir sage\mobile\products (or "mkdir -p sage\mobile\products" from Git Bash)
		cd sage\mobile
		git clone git@github.com:SageScottsdalePlatform/argos-sdk.git

__Note:__ If you're downloading the source zip file instead of using git directly, the net of the above is that you will want to establish a root folder for the argos projects (in our case, we used "mobile"). Put argos-sdk in that root folder, and any product-specific projects (such as argos-saleslogix) under a products sub-folder. When you download and extract the zip file, you will probably have a top-level folder named something like "SageScottsdalePlatform-argos-sdk-nnnnn". It is this folder that you will want to rename to "argos-sdk".

You should end up with a folder structure like this:
    source\sage\mobile\argos-sdk
    source\sage\mobile\products\<products like argos-saleslogix go here>