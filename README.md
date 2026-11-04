![Launch QuickLink](images/Launch-QuickLink.png)

# Launch QuickLink

#### Plugin Name: Launch QuickLink
#### Plugin Version: 1.0
#### Supported IdentityIQ Versions: IdentityIQ 8.0, 8.1, 8.2, 8.3, 8.4 or above
#### Supported Browsers: Any modern Chromium or Firefox browser (Internet Explorer not supported)
#### Primary Function: Launch QuickLinks directly with URL query parameters.

## Demo
![Launch QuickLink Demo](images/Demo.gif)

## Installation

* Simply drag and drop the plugin `.zip` into IdentityIQ Plugin page to install.

![image](images/Install.PNG)

![image](images/View.PNG)

## Configuration & Usage
Any available QuickLink in the navigation panel can be launched by constructing a URL with its canonical QuickLink name:

```text
https://iam.acme.com/identityiq/home.jsf?LaunchQL={QuickLink_Name}
```

> **Note on Name Matching:** The plugin matches on the canonical **QuickLink name** extracted from IdentityIQ's internal `chooseQuickLink` call arguments (e.g., `Request Access`, `Manage Access`), rather than localized display text. This ensures reliable matching across all user interface languages (English, German, French, Spanish, etc.).

If the QuickLink supports **For Me** and **For Others**, specify the recipient mode using `LaunchQLFor`:

**To Launch For Me (Default):**

```text
https://iam.acme.com/identityiq/home.jsf?LaunchQL={QuickLink_Name}
```
*Or explicitly:*
```text
https://iam.acme.com/identityiq/home.jsf?LaunchQL={QuickLink_Name}&LaunchQLFor=Me
```

**To Launch For Others:**

```text
https://iam.acme.com/identityiq/home.jsf?LaunchQL={QuickLink_Name}&LaunchQLFor=Others
```

## HTTP GET Request Behavior & Security Confirmation

* **GET Invocation:** The plugin activates upon navigating to `home.jsf` with the `LaunchQL` parameter passed in the HTTP `GET` query string.
* **Workflow Confirmation Prompt:** For security and safety, any **workflow-type QuickLink** (`action="workflow"`) prompts the user with a confirmation dialog before executing. This prevents unintended, automated execution of state-changing workflows (e.g. provisioning, lifecycle events, or modifications) through external or shared links. Standard navigation QuickLinks execute immediately without interruption.

## Verification
* Below example launches **Manage User Access / Request Access** directly without manual menu navigation:

```text
https://iam.acme.com/identityiq/home.jsf?LaunchQL=Manage User Access
```

## Compatibility & Maintenance Notice
* **Supported Versions:** IdentityIQ 8.0 through 8.4+.
* **Colab / Community Maintenance Responsibility:** This plugin is an open-source community/Colab project. It relies on the client-side QuickLinks panel (`#quicklinkPanel`) and the `SailPoint.Quicklinks.chooseQuickLink` JavaScript handler rendered by IdentityIQ. If future IdentityIQ releases modify the QuickLinks UI layout, DOM structure, or client-side execution framework, the repository/Colab author is responsible for updating and maintaining the plugin. This plugin is not an official product of SailPoint Technologies Inc.

## Feedback
* For bugs, feature enhancement requests, issues, or questions, please contact me on [LinkedIn](https://www.linkedin.com/in/shandeepsrinivas/) or [c.shandeep@gmail.com](mailto:c.shandeep@gmail.com).
