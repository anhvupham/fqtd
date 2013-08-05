using System.Configuration;
using System.Text;
using System.Web.Routing;
using System.Collections.Specialized;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.IO;

namespace System.Web.Mvc
{

    public static partial class HtmlHelpers
    {
        public static MvcHtmlString ActionQueryLink(this HtmlHelper htmlHelper,
            string linkText, string action, object routeValues)
        {
            var newRoute = routeValues == null
                ? htmlHelper.ViewContext.RouteData.Values
                : new RouteValueDictionary(routeValues);

            newRoute = htmlHelper.ViewContext.HttpContext.Request.QueryString
                .ToRouteDic(newRoute);

            return HtmlHelper.GenerateLink(htmlHelper.ViewContext.RequestContext,
                htmlHelper.RouteCollection, linkText, null,
                action, null, newRoute, null).ToMvcHtml();
        }

        public static MvcHtmlString ToMvcHtml(this string content)
        {
            return MvcHtmlString.Create(content);
        }

        public static RouteValueDictionary ToRouteDic(this NameValueCollection collection)
        {
            return collection.ToRouteDic(new RouteValueDictionary());
        }

        public static RouteValueDictionary ToRouteDic(this NameValueCollection collection,
            RouteValueDictionary routeDic)
        {
            foreach (string key in collection.Keys)
            {
                if (!routeDic.ContainsKey(key))
                    routeDic.Add(key, collection[key]);
            }
            return routeDic;
        }

        /// <summary>
        /// Insert GA with an Urchin and domain name
        /// </summary>
        /// <param name="htmlHelper"></param>
        /// <param name="urchin"></param>
        /// <param name="domainName"></param>
        /// <returns></returns>
        public static HtmlString Analytics(this HtmlHelper htmlHelper, string urchin, string domainName)
        {
            StringBuilder sb = new StringBuilder();

            sb.Append("<script type='text/javascript'>");
            sb.Append("  var _gaq = _gaq || [];");
            sb.Append(" _gaq.push(['_setAccount', '" + urchin + "']);");
            sb.Append(" _gaq.push(['_setDomainName', '" + domainName + "']);");
            sb.Append(" _gaq.push(['_trackPageview']);");
            sb.Append("  (function() {");
            sb.Append("   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;");
            sb.Append("    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';");
            sb.Append("   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);");
            sb.Append("  })();");
            sb.Append("</script>");

            return new HtmlString(sb.ToString());
        }
        public static void WriteErrorLogs(string log)
        {
            string path = VirtualPathUtility.ToAbsolute(ConfigurationManager.AppSettings["LogPath"]);
            if (!Directory.Exists(Path.GetDirectoryName(path)))
                Directory.CreateDirectory(Path.GetDirectoryName(path));
            if (!File.Exists(path))
                File.Create(path);
            var outputLines = new List<string>();
            outputLines.Add(string.Format("{0}: {1}", DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"), log));            
            System.IO.File.AppendAllLines(path, outputLines);
        }

        private static object FileInfo(string path)
        {
            throw new NotImplementedException();
        }

        /*
         * <script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-30424338-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
         * 
          <script type='text/javascript'>  
         * var _gaq = _gaq || []; 
         * _gaq.push(['_setAccount', 'UA-30424338-1']);
         * _gaq.push(['_setDomainName', 'thegioicover.com']);
         * _gaq.push(['_trackPageview']); 
         * (function() {   
         *  var ga = document.createElement('script'); 
         *  ga.type = 'text/javascript'; ga.async = true;    
         *  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';  
         *  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);  
         *  })();</script>

         */

        /// <summary>
        /// Pull the urchin and domain name from Web.Config
        /// </summary>
        /// <param name="htmlHelper"></param>
        /// <returns></returns>
        public static HtmlString Analytics(this HtmlHelper htmlHelper)
        {
            //pull values from Config
            string urchin = ConfigurationManager.AppSettings["ga-urchin"];
            string domainName = ConfigurationManager.AppSettings["ga-domainName"];
            return Analytics(htmlHelper, urchin, domainName);
        }
        public static string Substring(this HtmlHelper htmlHelper, string Source, int lenght)
        {
            //pull values from Config
            if (Source.Length > lenght)
                return Source.Substring(0, lenght) + "...";
            else return Source;
        }


        public static string StripDiacritics(string accented)
        {
            Regex regex = new Regex("\\p{IsCombiningDiacriticalMarks}+");

            string strFormD = accented.Normalize(NormalizationForm.FormD);
            return regex.Replace(strFormD, String.Empty).Replace('\u0111', 'd').Replace('\u0110', 'D');
        }
        public static List<string> GetImgListFormHTML(string html)
        {

            List<string> list = new List<string>();
            int index = 0; int index_end = 0;
            index = html.ToLower().IndexOf("src=");
            while (index > 0)
            {
                html = html.Substring(index + 5);
                index_end = html.ToLower().IndexOf('"');
                string s = html.Substring(0, index_end);
                list.Add(s);
                html = html.Substring(index_end);
                index = html.ToLower().IndexOf("src=");
            }
            return list;
        }
        public static List<string> GetImgTagListFormHTML(string html)
        {

            List<string> list = new List<string>();
            int index = 0; int index_end = 0;
            index = html.ToLower().IndexOf("<img");
            while (index > 0)
            {
                html = html.Substring(index);
                index_end = html.ToLower().IndexOf('>');
                string s = html.Substring(0, index_end + 1);
                list.Add(s);
                html = html.Substring(index_end);
                index = html.ToLower().IndexOf("<img");
            }
            return list;
        }
        //public static string GetOrders(int i)
        //{
        //    switch(i)
        //        case 1: return "";
        //            finally: return "";
        //}

    }
}
namespace System
{
    public static partial class ParseData
    {
        public static int ParseToInt(this int Int, object obj)
        {
            Int32 i = 0;
            Int32.TryParse(obj + "", out i);
            return i;
        }
        public static decimal ParseToDecimal(this decimal Dec, object obj)
        {
            decimal i = 0;
            decimal.TryParse(obj + "", out i);
            return i;
        }
    }
}