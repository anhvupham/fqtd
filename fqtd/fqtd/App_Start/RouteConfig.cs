using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace fqtd
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                  name: "result",
                  url: "result/index/{form}/{category}/{brand}/{range}/{address}/{search}",                  
                  defaults: new { controller = "Result", action = "ShowResult", address = string.Empty, range = -1, category = -1, brand = -1, search = string.Empty, form = -1 }
            );           

            routes.MapRoute(
                name: "detail",
                url: "detail/{id}",
                defaults: new { controller = "Detail", action = "Index", id = UrlParameter.Optional }
            );

            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
            );

        }
    }
}