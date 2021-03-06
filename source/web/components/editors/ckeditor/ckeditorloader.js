/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * This Class is based on Alfresco content.js
 * Modified to be used by the CKEditor control i Share Extras project.
 * The original Alfresco LGPL license remains in this file. The rest of
 * CKEditor Alfresco Plugin is Apache 2.0 licensed.
 * The external CKEditor code is licensed separately.
 */
 
/**
 * Content control component.
 * 
 * This component renders an editor appropriate for the the mimetype
 * of the content.
 * 
 * Plain text content is rendered in a textarea.
 * Rich text content is rendered in a CKEditor editor.
 * Images are displayed with a browse content control.
 * 
 * @namespace Alfresco
 * @class Alfresco.CKEditorContentControl
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom;

   /**
    * CKEditorContentControl constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.TextControl} The new CKEditorContentControl instance
    * @constructor
    */
   Alfresco.CKEditorContentControl = function(htmlId)
   {
      return Alfresco.CKEditorContentControl.superclass.constructor.call(this, "Alfresco.CKEditorContentControl", htmlId, ["button"]);
   };
   
   YAHOO.extend(Alfresco.CKEditorContentControl, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * Current Form Mode: edit or create
          * 
          * @property formMode
          * @type string
          */
         formMode: "edit",
         
         /**
          * NodeRef of the item the form is for
          * 
          * @property nodeRef
          * @type string
          */
         nodeRef: null,
         
         /**
          * The mimetype of the content being created
          * 
          * @property mimeType
          * @type string
          */
         mimeType: null,
         
         /**
          * The identified mimetype of the content/property
          * 
          * @property contentMimetype
          * @type string
          */
         contentMimetype: null,
         
         /**
          * Comma separated list of mime types that will be shown
          * in a textarea
          * 
          * @property plainMimeTypes
          * @type string
          */
         plainMimeTypes: "text/plain,text/xml",
         
         /**
          * Comma separated list of mime types that will be shown
          * in the TinyMCE editor
          * 
          * @property richMimeTypes
          * @type string
          */
         richMimeTypes: "text/html,text/xhtml",
         
         /**
          * Comma separated list of mime types that will be shown
          * using the img tag and allow upload of new versions
          * 
          * @property imageMimeTypes
          * @type string
          */
         imageMimeTypes: "image/jpeg,image/jpg,image/png",
         
         /**
          * Whether the (plain text) editor should be forced visible, e.g. mimetype unrecognized
          * 
          * @property forceEditor
          * @type boolean
          */
         forceEditor: false,

         /**
          * Whether (empty) content should be created when editor is hidden, e.g. mimetype unrecognized.
          * Note: Only relevant when forceEditor = false
          * 
          * @property forceContent
          * @type boolean
          */
         forceContent: false,
         
         /**
          * Load external config file
          */
         settingsfile: 'components/editors/ckeditor/config.js',

      },

      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function CKEditorContentControl_onReady()
      {
         if (Alfresco.logger.isDebugEnabled())
         {
            Alfresco.logger.debug("Rendering content control for element '" + this.id + "', value = '" + this.options.currentValue + 
                  "', nodeRef = '" + this.options.nodeRef + "', mimetype = '" + this.options.mimeType + "'");
            Alfresco.logger.debug("Configured plain mimetypes for element '" + this.id + "': " + this.options.plainMimeTypes);
            Alfresco.logger.debug("Configured rich mimetypes for element '" + this.id + "': " + this.options.richMimeTypes);
            Alfresco.logger.debug("Configured image mimetypes for element '" + this.id + "': " + this.options.imageMimeTypes);
            Alfresco.logger.debug("Editor parameters for element '" + this.id + "': " + 
                  YAHOO.lang.dump(this.options.editorParameters));
         }
                  
         // get the mimetype of the content         
                this.contentMimetype = this._determineMimeType();
            
         if (this.contentMimetype !== null)
         {
            if (this._isRichMimeType(this.contentMimetype))
            {
               if (this.options.formMode === "create")
               {
                  // in create mode render the editor immediately
                  if (!this.options.disabled)
                  {
                     this._renderEditor();
                     //Alfresco.logger.debug("Editor rendered");
                  }
               }
               else if (this.options.fieldName !== "cm:content")
               {
                     this._renderEditor();
                     Dom.get(this.id).value = this.options.currentValue;
               }
               else
               {
                  // populate the textarea with the content and
                  // once that is complete call the provided
                  // callback function to render the TinyMCE
                  // editor (when it's not disabled)
                  this._populateContent(
                  {
                     successCallback: 
                     {
                        fn: function()
                        {
                           if (!this.options.disabled)
                           {
                              this._renderEditor();
                              //Alfresco.logger.debug("Editor rendered");
                           }
                        },
                        scope: this
                     }
                  });
               }
            }
            else if (this._isPlainMimeType(this.contentMimetype) || this.options.forceEditor)
            {
               // populate the textarea with the content
               this._populateContent();
            }
            else if (this._isImageMimeType(this.contentMimetype))
            {
               this._hideField();
               
               if (Alfresco.logger.isDebugEnabled())
                  Alfresco.logger.debug("Hidden field '" + this.id + "' as support for images is not completed yet");
               
               // TODO: remove textarea from DOM
               //       add <img> to field DOM programatically
               //       add <input type="file" /> to DOM programatically
               //       make the image height and width configurable
               //       generate URL to the image using the nodeRef (cmis content webscript?)
               //       investigate whether the picked image can be shown 
            }
            else
            {
               this._hideField();
               
               if (Alfresco.logger.isDebugEnabled())
                  Alfresco.logger.debug("Hidden field '" + this.id + "' as the content for the mimetype can not be displayed");
            }
         }
         else
         {
            this._hideField();
            
            if (Alfresco.logger.isDebugEnabled())
               Alfresco.logger.debug("Hidden field '" + this.id + "' as the mimetype is unknown");
         }
      },
      
      /**
       * Retrieves and populates the content for the current control
       * 
       * @method _populateContent
       * @param callback Optional object containing a callback function
       * @private
       */
      _populateContent: function CKEditorContentControl__populateContent(callback)
      {
         if (this.options.nodeRef !== null && this.options.nodeRef.length > 0)
         {
            if (Alfresco.logger.isDebugEnabled())
               Alfresco.logger.debug("Retrieving content for field '" + this.id + "' using nodeRef: " + this.options.nodeRef);
            
            // success handler, show the content
            var onSuccess = function CKEditorContentControl_populateContent_onSuccess(response)
            {
               Dom.get(this.id).value = response.serverResponse.responseText;
               
               // if a callback was provided, execute it
               if (callback && callback.successCallback)
               {
                  if (Alfresco.logger.isDebugEnabled())
                     Alfresco.logger.debug("calling callback");
                  
                  callback.successCallback.fn.call(callback.successCallback.scope, response);
               }
            };
            
            // failure handler, display alert
            var onFailure = function CKEditorContentControl_populateContent_onFailure(response)
            {
               // hide the whole field so incorrect content does not get re-submitted
               this._hideField();
               
               if (Alfresco.logger.isDebugEnabled())
                  Alfresco.logger.debug("Hidden field '" + this.id + "' as content retrieval failed");
            };
            
            // attempt to retrieve content
            var nodeRefUrl = this.options.nodeRef.replace("://", "/");
            Alfresco.util.Ajax.request(
            {
               url: Alfresco.constants.PROXY_URI + "api/node/content/" + nodeRefUrl,
               method: "GET",
               successCallback:
               {
                  fn: onSuccess,
                  scope: this
               },
               failureCallback:
               {
                  fn: onFailure,
                  scope: this
               }
            });
         }
         else if (this.options.formMode !== "create")
         {
            this._hideField();
            
            if (Alfresco.logger.isDebugEnabled())
               Alfresco.logger.debug("Hidden field '" + this.id + "' as the nodeRef parameter is missing");
         }
      },
      
      /**
       * Returns the mimetype for the content property.
       * 
       * Returns null if the field is not a content property.
       * 
       * If a mimetype can not be determined from the content url of the property
       * the mimeType parameter is examined, if that is empty or null, null is returned.
       * 
       * @method _determineMimeType
       * @return the mimetype or null if it can not be determined
       */
      _determineMimeType: function CKEditorContentControl__determineMimeType()
      {
         var result = null;
         
         if (this.options.currentValue.indexOf("contentUrl=") === 0 &&
             this.options.currentValue.indexOf("mimetype=") !== -1)
         {
            // extract the mimetype from the content url
            var mtBegIdx = this.options.currentValue.indexOf("mimetype=") + 9,
               mtEndIdx = this.options.currentValue.indexOf("|", mtBegIdx);
            result = this.options.currentValue.substring(mtBegIdx, mtEndIdx);
         }
         
         // if the content url did not contain the mimetype examine
         // the mimeType parameter
         if (this.options.mimeType !== null && this.options.mimeType.length > 0)
         {
            result = this.options.mimeType;
         }
         
         if (Alfresco.logger.isDebugEnabled())
            Alfresco.logger.debug("Determined mimetype: " + result);
         
         return result;
      },
      
      /**
       * Determines whether the given mimetype is a configured 'rich' mimetype.
       * 
       * @method _isRichMimeType
       * @param mimetype {string} The mimetype to check
       * @return true if the given mimetype is a 'rich' mimetype
       */
      _isRichMimeType: function CKEditorContentControl__isRichMimeType(mimetype)
      {
         var result = false;
         
         if (this.options.richMimeTypes !== null && this.options.richMimeTypes.length > 0 &&
             this.options.richMimeTypes.indexOf(mimetype) != -1)
         {
            result = true;
         }
         
         if (Alfresco.logger.isDebugEnabled())
            Alfresco.logger.debug("Testing whether '" + mimetype + "' is a configured rich mimetype: " + result);
         
         return result;
      },
      
      /**
       * Determines whether the given mimetype is a configured 'plain' mimetype.
       * 
       * @method _isPlainMimeType
       * @param mimetype {string} The mimetype to check
       * @return true if the given mimetype is a 'plain' mimetype
       */
      _isPlainMimeType: function CKEditorContentControl__isPlainMimeType(mimetype)
      {
         var result = false;
         
         if (this.options.plainMimeTypes !== null && this.options.plainMimeTypes.length > 0 &&
             this.options.plainMimeTypes.indexOf(mimetype) != -1)
         {
            result = true;
         }
         
         if (Alfresco.logger.isDebugEnabled())
            Alfresco.logger.debug("Testing whether '" + mimetype + "' is a configured plain mimetype: " + result);
         
         return result;
      },
      
      /**
       * Determines whether the given mimetype is a configured 'image' mimetype.
       * 
       * @method _isImageMimeType
       * @param mimetype {string} The mimetype to check
       * @return true if the given mimetype is an 'image' mimetype
       */
      _isImageMimeType: function CKEditorContentControl__isImageMimeType(mimetype)
      {
         var result = false;
         
         if (this.options.imageMimeTypes !== null && this.options.imageMimeTypes.length > 0 &&
             this.options.imageMimeTypes.indexOf(mimetype) != -1)
         {
            result = true;
         }
         
         if (Alfresco.logger.isDebugEnabled())
            Alfresco.logger.debug("Testing whether '" + mimetype + "' is a configured image mimetype: " + result);
         
         return result;
      },
      
      /**
       * Hides the field, used when a content property can not be shown.
       * 
       * @method _hideField
       * @private
       */
      _hideField: function CKEditorContentControl__hideField()
      {
         if (!this.options.forceContent)
         {
            // change the name of the textarea so it is not submitted as new content!
            Dom.get(this.id).name = "-";
         }
         
         // hide the whole field
         Dom.get(this.id + "-field").style.display = "none";
      },
      
      /**
       * Render the CKEditor
       */
      _renderEditor: function CKEditorContentControl_RenderEditor(){
                              
                              var editor = CKEDITOR.replace(this.id,
                                      {
                                              customConfig : Alfresco.constants.URL_RESCONTEXT+this.options.settingsfile
                                      });
              
                              /**
                               * These events to handle update is from
                               * http://alfonsoml.blogspot.com/2011/03/onchange-event-for-ckeditor.html
                               * Slightly changed to fit this purpose
                               */
                              editor.timer=0

                              editor.on( 'saveSnapshot', function(e) { CKEditor_updateElement(e); });
                              editor.on( 'afterUndoImage', function(e) { CKEditor_updateElement(e);  } );
                              editor.on( 'blur', function(e) { CKEditor_updateElement(e);  } );

                              editor.on( 'afterCommandExec', function(e)
                              {
                                  if ( e.data.command.canUndo !== false ){
                                          CKEditor_updateElement(e);
                                  }        
                              } );
                              editor.on( 'key', function(e) { CKEditor_updateElement(e);  } );

      }
   });
})();

function CKEditor_updateElement(e){
    //Use timer function so it not fire to often
        //Alfresco.logger.debug("UPDATE called by "+e.name);
  
          if (e.editor.timer){
                  //Alfresco.logger.debug("UPDATE called, timer, exiting");
        return;
          }
 
          e.editor.timer = setTimeout( function() {
                  e.editor.timer = 0;
               if(e.editor.checkDirty()){
                       //Alfresco.logger.debug("UPDATE called, isDirty, updating");
                       e.editor.updateElement();
                       e.editor.resetDirty();
               }
    }, 100);
}